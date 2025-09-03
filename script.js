// TaskMaster - Intermediate To-Do List Application

// Get all the elements we need from the page
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const prioritySelect = document.getElementById('prioritySelect');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');

// Application state
let tasks = [];
let currentFilter = 'all';
let searchTerm = '';

// Task management functions
function createTask(text, priority = 'medium') {
    return {
        id: Date.now() + Math.random(), // Unique ID
        text: text.trim(),
        completed: false,
        priority: priority,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
}

function addTask() {
    const taskText = taskInput.value.trim();
    const priority = prioritySelect.value;
    
    // Validate input
    if (taskText === '') {
        showNotification('Please enter a task!', 'error');
        taskInput.focus();
        return;
    }
    
    if (taskText.length > 150) {
        showNotification('Task is too long! Keep it under 150 characters.', 'error');
        return;
    }
    
    // Create and add new task
    const newTask = createTask(taskText, priority);
    tasks.unshift(newTask); // Add to beginning of array
    
    // Reset form
    taskInput.value = '';
    prioritySelect.value = 'medium';
    
    // Update display
    renderTasks();
    updateTaskCount();
    saveToStorage();
    showNotification('Task added successfully!', 'success');
}

function toggleTask(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
        }
        return task;
    });
    
    renderTasks();
    updateTaskCount();
    saveToStorage();
}

function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    
    if (confirm(`Are you sure you want to delete "${task.text}"?`)) {
        // Add removing animation
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        taskElement.classList.add('removing');
        
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== taskId);
            renderTasks();
            updateTaskCount();
            saveToStorage();
            showNotification('Task deleted', 'info');
        }, 300);
    }
}

function editTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const taskTextElement = taskElement.querySelector('.task-text');
    const editInput = taskElement.querySelector('.task-edit-input');
    
    // Enter edit mode
    taskElement.classList.add('editing');
    editInput.value = taskTextElement.textContent;
    editInput.focus();
    editInput.select();
}

function saveEdit(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const editInput = taskElement.querySelector('.task-edit-input');
    const newText = editInput.value.trim();
    
    if (newText === '') {
        showNotification('Task cannot be empty!', 'error');
        return;
    }
    
    // Update task
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            task.text = newText;
        }
        return task;
    });
    
    // Exit edit mode
    taskElement.classList.remove('editing');
    renderTasks();
    saveToStorage();
    showNotification('Task updated!', 'success');
}

function cancelEdit(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    taskElement.classList.remove('editing');
}

// Display and filtering functions
function getFilteredTasks() {
    let filteredTasks = tasks;
    
    // Apply search filter
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
            task.text.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // Apply status filter
    switch (currentFilter) {
        case 'active':
            filteredTasks = filteredTasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = filteredTasks.filter(task => task.completed);
            break;
        default:
            // 'all' - no additional filtering needed
            break;
    }
    
    return filteredTasks;
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    // Clear current tasks
    taskList.innerHTML = '';
    
    // Show/hide empty state
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Create task elements
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskItem.setAttribute('data-task-id', task.id);
    
    const timeAgo = getTimeAgo(task.createdAt);
    
    taskItem.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
               onchange="toggleTask(${task.id})">
        
        <div class="task-content">
            <span class="task-text">${escapeHtml(task.text)}</span>
            <input type="text" class="task-edit-input" value="${escapeHtml(task.text)}">
            <div class="task-meta">
                <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                <span class="task-time">Created ${timeAgo}</span>
            </div>
        </div>
        
        <div class="task-actions">
            <button class="edit-btn" onclick="editTask(${task.id})">Edit</button>
            <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
        </div>
        
        <div class="edit-actions">
            <button class="save-btn" onclick="saveEdit(${task.id})">Save</button>
            <button class="cancel-btn" onclick="cancelEdit(${task.id})">Cancel</button>
        </div>
    `;
    
    return taskItem;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
}

function updateTaskCount() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const activeTasks = totalTasks - completedTasks;
    
    let countText = '';
    if (totalTasks === 0) {
        countText = '0 tasks';
    } else if (currentFilter === 'all') {
        countText = `${totalTasks} task${totalTasks !== 1 ? 's' : ''} (${activeTasks} active)`;
    } else if (currentFilter === 'active') {
        countText = `${activeTasks} active task${activeTasks !== 1 ? 's' : ''}`;
    } else {
        countText = `${completedTasks} completed task${completedTasks !== 1 ? 's' : ''}`;
    }
    
    taskCount.textContent = countText;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '1000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page and animate in
    document.body.appendChild(notification);
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Storage functions
function saveToStorage() {
    try {
        localStorage.setItem('taskmaster-tasks', JSON.stringify(tasks));
    } catch (error) {
        showNotification('Failed to save tasks', 'error');
    }
}

function loadFromStorage() {
    try {
        const savedTasks = localStorage.getItem('taskmaster-tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
    } catch (error) {
        showNotification('Failed to load saved tasks', 'error');
        tasks = [];
    }
}

// Event handlers
function handleFilterChange(filter) {
    currentFilter = filter;
    
    // Update active filter button
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    renderTasks();
    updateTaskCount();
}

function handleSearch() {
    searchTerm = searchInput.value.trim();
    renderTasks();
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        showNotification('No completed tasks to clear', 'info');
        return;
    }
    
    if (confirm(`Delete ${completedCount} completed task${completedCount !== 1 ? 's' : ''}?`)) {
        tasks = tasks.filter(task => !task.completed);
        renderTasks();
        updateTaskCount();
        saveToStorage();
        showNotification(`Cleared ${completedCount} completed task${completedCount !== 1 ? 's' : ''}`, 'success');
    }
}

// Event listeners
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

searchInput.addEventListener('input', handleSearch);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => handleFilterChange(btn.dataset.filter));
});

clearCompleted.addEventListener('click', clearCompletedTasks);

// Handle edit input Enter key
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('task-edit-input')) {
        const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
        saveEdit(taskId);
    }
});

// Handle edit input Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && e.target.classList.contains('task-edit-input')) {
        const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
        cancelEdit(taskId);
    }
});

// Initialize the application
function initApp() {
    loadFromStorage();
    renderTasks();
    updateTaskCount();
    taskInput.focus();
}

// Start the app when page loads
window.addEventListener('load', initApp);
// Get DOM elements
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const searchInput = document.getElementById('searchInput');
const filterPriority = document.getElementById('filterPriority');
const clearAllBtn = document.getElementById('clearAllBtn');

let tasks = JSON.parse(localStorage.getItem('kanbanTasks')) || [];
let currentColumn = 'todo';
let draggedElement = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderAllTasks();
    setupEventListeners();
});

// Open modal
function openModal(column) {
    currentColumn = column;
    taskModal.classList.add('show');
    document.getElementById('taskDueDate').valueAsDate = new Date();
}

// Close modal
function closeModal() {
    taskModal.classList.remove('show');
    taskForm.reset();
}

// Add task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const task = {
        id: Date.now(),
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value,
        column: currentColumn
    };

    tasks.push(task);
    saveToLocalStorage();
    renderAllTasks();
    closeModal();
});

// Render all tasks
function renderAllTasks() {
    const columns = ['todo', 'inprogress', 'done'];
    columns.forEach(column => {
        const list = document.getElementById(`${column}List`);
        const columnTasks = tasks.filter(t => t.column === column);
        
        list.innerHTML = columnTasks.map(task => createTaskCard(task)).join('');
        updateTaskCount(column, columnTasks.length);
    });

    applyFilters();
}

// Create task card
function createTaskCard(task) {
    const isOverdue = new Date(task.dueDate) < new Date() && task.column !== 'done';
    
    return `
        <div class="task-card ${isOverdue ? 'overdue' : ''}" 
             draggable="true" 
             data-id="${task.id}"
             ondragstart="handleDragStart(event)"
             ondragend="handleDragEnd(event)">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-footer">
                <span class="task-priority ${task.priority}">${task.priority}</span>
                <span class="task-date">📅 ${formatDate(task.dueDate)}</span>
            </div>
            <div class="task-actions">
                <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        </div>
    `;
}

// Delete task
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToLocalStorage();
    renderAllTasks();
}

// Clear all tasks
clearAllBtn.addEventListener('click', () => {
    if (tasks.length === 0) return;
    
    if (confirm('Are you sure you want to delete all tasks?')) {
        tasks = [];
        saveToLocalStorage();
        renderAllTasks();
    }
});

// Drag and drop handlers
function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function setupEventListeners() {
    const taskLists = document.querySelectorAll('.task-list');
    
    taskLists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('drop', handleDrop);
        list.addEventListener('dragenter', handleDragEnter);
        list.addEventListener('dragleave', handleDragLeave);
    });

    // Search and filter
    searchInput.addEventListener('input', applyFilters);
    filterPriority.addEventListener('change', applyFilters);

    // Close modal on outside click
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    if (e.target.classList.contains('task-list')) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('task-list')) {
        e.target.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const list = e.target.closest('.task-list');
    if (!list) return;
    
    list.classList.remove('drag-over');
    
    const taskId = parseInt(draggedElement.dataset.id);
    const newColumn = list.dataset.column;
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.column = newColumn;
        saveToLocalStorage();
        renderAllTasks();
    }
}

// Search and filter
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const priorityFilter = filterPriority.value;
    
    document.querySelectorAll('.task-card').forEach(card => {
        const taskId = parseInt(card.dataset.id);
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                            task.description.toLowerCase().includes(searchTerm);
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        
        card.style.display = matchesSearch && matchesPriority ? 'block' : 'none';
    });
}

// Update task count
function updateTaskCount(column, count) {
    document.getElementById(`${column}Count`).textContent = count;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

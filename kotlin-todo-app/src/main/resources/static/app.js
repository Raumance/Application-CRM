const API_URL = '/api/todos';
let currentFilter = 'all';

// DOM elements
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const statsCount = document.getElementById('count');
const filterBtns = document.querySelectorAll('.btn-filter');

// Fetch all todos
async function fetchTodos() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Erreur lors du chargement');
    return res.json();
}

// Create todo
async function createTodo(title) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Erreur lors de la création');
    return res.json();
}

// Update todo
async function updateTodo(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour');
    return res.ok ? null : res.json();
}

// Delete todo
async function deleteTodo(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('Erreur lors de la suppression');
}

// Render todo item
function renderTodo(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} aria-label="Marquer comme terminé">
        <span class="todo-text">${escapeHtml(todo.title)}</span>
        <input type="text" class="todo-edit-input" value="${escapeHtml(todo.title)}">
        <button type="button" class="btn-delete" aria-label="Supprimer">✕</button>
    `;

    const checkbox = li.querySelector('.todo-checkbox');
    const textSpan = li.querySelector('.todo-text');
    const editInput = li.querySelector('.todo-edit-input');
    const deleteBtn = li.querySelector('.btn-delete');

    checkbox.addEventListener('change', async () => {
        await updateTodo(todo.id, { completed: !todo.completed });
        li.classList.toggle('completed', !todo.completed);
        updateStats();
    });

    textSpan.addEventListener('dblclick', () => {
        li.classList.add('editing');
        editInput.focus();
        editInput.select();
    });

    editInput.addEventListener('blur', saveEdit);
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEdit(e);
        if (e.key === 'Escape') cancelEdit();
    });

    function saveEdit(e) {
        const newTitle = editInput.value.trim();
        if (newTitle && newTitle !== todo.title) {
            updateTodo(todo.id, { title: newTitle }).then(() => {
                todo.title = newTitle;
                textSpan.textContent = newTitle;
            });
        }
        li.classList.remove('editing');
    }

    function cancelEdit() {
        editInput.value = todo.title;
        li.classList.remove('editing');
    }

    deleteBtn.addEventListener('click', async () => {
        await deleteTodo(todo.id);
        li.remove();
        updateStats();
    });

    return li;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function filterTodos(todos) {
    if (currentFilter === 'active') return todos.filter(t => !t.completed);
    if (currentFilter === 'completed') return todos.filter(t => t.completed);
    return todos;
}

function updateStats() {
    const items = todoList.querySelectorAll('.todo-item');
    const total = items.length;
    const completed = todoList.querySelectorAll('.todo-item.completed').length;
    const active = total - completed;

    let text = '';
    if (currentFilter === 'all') text = `${active} restante(s)`;
    else if (currentFilter === 'active') text = `${active} active(s)`;
    else text = `${completed} terminée(s)`;

    statsCount.textContent = text;
}

async function loadTodos() {
    todoList.innerHTML = '<li class="loading">Chargement...</li>';
    try {
        const todos = await fetchTodos();
        const filtered = filterTodos(todos);
        todoList.innerHTML = '';
        filtered.forEach(todo => todoList.appendChild(renderTodo(todo)));
        updateStats();
    } catch (err) {
        todoList.innerHTML = `<li class="error">${err.message}. Vérifiez que MONGODB_URI est configuré.</li>`;
    }
}

// Form submit
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = todoInput.value.trim();
    if (!title) return;

    todoInput.disabled = true;
    try {
        const todo = await createTodo(title);
        if (currentFilter !== 'completed') {
            todoList.appendChild(renderTodo(todo));
        }
        updateStats();
        todoInput.value = '';
    } catch (err) {
        alert(err.message);
    } finally {
        todoInput.disabled = false;
        todoInput.focus();
    }
});

// Filters
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        loadTodos();
    });
});

loadTodos();

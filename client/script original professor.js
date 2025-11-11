        let tasks = [];// lista de tasks
        let editingTaskId = null;
        let currentFilter = 'todas';

        /**
         * !seleciona do html todos os botoes e etc que irei usar
         */
        //PEGA TODOS OS DOM
        const taskForm = document.getElementById('taskForm');
        const taskTitle = document.getElementById('taskTitle');
        const taskDescription = document.getElementById('taskDescription');
        const taskPriority = document.getElementById('taskPriority');
        const tasksContainer = document.getElementById('tasksContainer');
        const submitBtn = document.getElementById('submitBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const formTitle = document.getElementById('formTitle');
        const filterBtns = document.querySelectorAll('.filter-btn');

        // Inicialização
        loadTasks();//CARREGA TASKS DO COOKIES
        updateStats();//ATUALIZA OS NUMEROS DE COMPLETSO E PENDENTES ETC
        renderTasks();

        // Event Listeners
        taskForm.addEventListener('submit', handleSubmit);
        cancelBtn.addEventListener('click', cancelEdit);
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.filter;
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderTasks();
            });
        });

        // Funções principais
        function handleSubmit(e) {
            e.preventDefault();
            
            const task = {
                id: editingTaskId || Date.now().toString(),
                title: taskTitle.value.trim(),
                description: taskDescription.value.trim(),
                priority: taskPriority.value,
                completed: editingTaskId ? tasks.find(t => t.id === editingTaskId).completed : false,
                createdAt: editingTaskId ? tasks.find(t => t.id === editingTaskId).createdAt : new Date().toISOString()
            };

            if (editingTaskId) {
                const index = tasks.findIndex(t => t.id === editingTaskId);
                tasks[index] = task;
                editingTaskId = null;
                submitBtn.textContent = 'Adicionar Tarefa';
                cancelBtn.style.display = 'none';
                formTitle.textContent = '➕ Nova Tarefa';
            } else {
                tasks.unshift(task);
            }

            saveTasks();
            updateStats();
            renderTasks();
            taskForm.reset();
            taskPriority.value = 'media';
        }

        function renderTasks() {
            let filteredTasks = [...tasks];//espalha todas as

            // Aplicar filtros
            if (currentFilter === 'pendentes') {
                filteredTasks = filteredTasks.filter(t => !t.completed);
            } else if (currentFilter === 'concluidas') {
                filteredTasks = filteredTasks.filter(t => t.completed);
            } else if (currentFilter === 'alta') {
                filteredTasks = filteredTasks.filter(t => t.priority === 'alta');
            }

            if (filteredTasks.length === 0) {
                tasksContainer.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        <h3>Nenhuma tarefa encontrada</h3>
                        <p>${currentFilter !== 'todas' ? 'Nenhuma tarefa neste filtro.' : 'Adicione sua primeira tarefa para começar!'}</p>
                    </div>
                `;
                return;
            }

            tasksContainer.innerHTML = filteredTasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''} ${editingTaskId === task.id ? 'edit-mode' : ''}" data-id="${task.id}">
                    <div class="task-header">
                        <div class="task-content">
                            <div class="task-title">${escapeHtml(task.title)}</div>
                            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                            <div class="task-meta">
                                <span class="task-priority priority-${task.priority}">
                                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                                <span>📅 ${formatDate(task.createdAt)}</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="btn-success" onclick="toggleComplete('${task.id}')" aria-label="${task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}">
                                ${task.completed ? '↩️ Reabrir' : '✓ Concluir'}
                            </button>
                            <button class="btn-edit" onclick="editTask('${task.id}')" aria-label="Editar tarefa">✏️ Editar</button>
                            <button class="btn-delete" onclick="deleteTask('${task.id}')" aria-label="Excluir tarefa">🗑️ Excluir</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function toggleComplete(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                saveTasks();
                updateStats();
                renderTasks();
            }
        }

        function editTask(id) {                             // HTTP EDIT
            const task = tasks.find(t => t.id === id);
            if (task) {
                editingTaskId = id;
                taskTitle.value = task.title;
                taskDescription.value = task.description;
                taskPriority.value = task.priority;
                submitBtn.textContent = '💾 Salvar Alterações';
                cancelBtn.style.display = 'inline-block';
                formTitle.textContent = '✏️ Editando Tarefa';
                taskTitle.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        function cancelEdit() {
            editingTaskId = null;
            taskForm.reset();
            taskPriority.value = 'media';
            submitBtn.textContent = 'Adicionar Tarefa';
            cancelBtn.style.display = 'none';
            formTitle.textContent = '➕ Nova Tarefa';
            renderTasks();
        }

        function deleteTask(id) {
            if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                tasks = tasks.filter(t => t.id !== id);
                if (editingTaskId === id) {
                    cancelEdit();
                }
                saveTasks();
                updateStats();
                renderTasks();
            }
        }

        function updateStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const pending = total - completed;

            document.getElementById('totalTasks').textContent = total;
            document.getElementById('completedTasks').textContent = completed;
            document.getElementById('pendingTasks').textContent = pending;
        }

        function saveTasks() {
            try {
                const tasksData = JSON.stringify(tasks);
                document.cookie = `tasks=${encodeURIComponent(tasksData)}; path=/; max-age=31536000; SameSite=Lax`;
            } catch (error) {
                console.error('Erro ao salvar tarefas:', error);
            }
        }

        function loadTasks() {
            try {
                const cookies = document.cookie.split(';');
                const tasksCookie = cookies.find(c => c.trim().startsWith('tasks='));
                
                if (tasksCookie) {
                    const tasksData = decodeURIComponent(tasksCookie.split('=')[1]);
                    tasks = JSON.parse(tasksData);
                }
            } catch (error) {
                console.error('Erro ao carregar tarefas:', error);
                tasks = [];
            }
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
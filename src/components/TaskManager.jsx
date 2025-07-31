import { useState, useEffect } from 'react';
import Stats from './Stats';
import { useTranslation } from 'react-i18next';

function TaskManager() {
  const { t, i18n } = useTranslation();
  console.log('TaskManager language:', i18n.language);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeSpent, setTimeSpent] = useState({});
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    const savedTasks = localStorage.getItem('quickzone-tasks');
    const savedTimeSpent = localStorage.getItem('quickzone-time');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedTimeSpent) setTimeSpent(JSON.parse(savedTimeSpent));
  }, []);

  useEffect(() => {
    localStorage.setItem('quickzone-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('quickzone-time', JSON.stringify(timeSpent));
  }, [timeSpent]);

  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimeSpent(prev => ({
          ...prev,
          [activeTimer]: (prev[activeTimer] || 0) + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const addTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [...prev, task]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setTimeSpent(prev => {
      const newTimeSpent = { ...prev };
      delete newTimeSpent[id];
      return newTimeSpent;
    });
    if (activeTimer === id) setActiveTimer(null);
  };

  const startTimer = (id) => {
    setActiveTimer(activeTimer === id ? null : id);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(task => task.completed).length;
  const totalTime = Object.values(timeSpent).reduce((sum, time) => sum + time, 0);

  return (
    <div className="task-manager">
      <Stats totalTasks={tasks.length} completedTasks={completedCount} totalTime={formatTime(totalTime)} />
      <form onSubmit={addTask} className="task-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder={t('addTaskPlaceholder')}
        />
        <button type="submit">{t('addTask')}</button>
      </form>
      <div className="filters">
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>{t('all')}</button>
        <button onClick={() => setFilter('active')} className={filter === 'active' ? 'active' : ''}>{t('active')}</button>
        <button onClick={() => setFilter('completed')} className={filter === 'completed' ? 'active' : ''}>{t('completedBtn')}</button>
      </div>
      {filteredTasks.length === 0 ? (
        <p className="empty-state">{t('noTasks')}</p>
      ) : (
        <ul className="task-list">
          {filteredTasks.map(task => (
            <li key={task.id} className={task.completed ? 'completed' : ''}>
              <div className="task-content">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="task-checkbox"
                />
                <span className="task-text">{task.text}</span>
              </div>
              <div className="task-actions">
                <div className="timer-section">
                  <span className="time-display">
                    {formatTime(timeSpent[task.id] || 0)}
                  </span>
                  <button
                    onClick={() => startTimer(task.id)}
                    className={`timer-btn ${activeTimer === task.id ? 'active' : ''}`}
                  >
                    {activeTimer === task.id ? '⏸️' : '▶️'}
                  </button>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="delete-btn"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {activeTimer && (
        <div className="active-timer">
          <p>⏱️ {t('timerRunning')} {tasks.find(t => t.id === activeTimer)?.text}</p>
        </div>
      )}
    </div>
  );
}

export default TaskManager; 

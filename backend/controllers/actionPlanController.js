const ActionPlan = require('../models/ActionPlan');

// @desc Get all action plans & tasks for farmer
// @route GET /api/action-plans
const getActionPlans = async (req, res) => {
  try {
    const tasks = await ActionPlan.find({ farmerId: req.user._id }).sort({ isCompleted: 1, createdAt: -1 });

    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        tasks,
        stats: {
          total,
          completed,
          pending,
          completionRate,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle task completion state
// @route PUT /api/action-plans/:id/toggle
const toggleTaskCompletion = async (req, res) => {
  try {
    const task = await ActionPlan.findOne({ _id: req.params.id, farmerId: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
    await task.save();

    res.json({ success: true, message: `Task marked as ${task.isCompleted ? 'completed' : 'pending'}`, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create custom action plan task
// @route POST /api/action-plans
const createTask = async (req, res) => {
  try {
    const { title, titleHi, description, dayLabel, priority, category, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide task title' });
    }

    const task = await ActionPlan.create({
      farmerId: req.user._id,
      title,
      titleHi: titleHi || '',
      description: description || '',
      dayLabel: dayLabel || 'TODAY',
      priority: priority || 'Medium',
      category: category || 'General',
      dueDate: dueDate || new Date(),
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete action plan task
// @route DELETE /api/action-plans/:id
const deleteTask = async (req, res) => {
  try {
    const task = await ActionPlan.findOneAndDelete({ _id: req.params.id, farmerId: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActionPlans,
  toggleTaskCompletion,
  createTask,
  deleteTask,
};

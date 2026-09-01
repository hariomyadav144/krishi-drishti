const express = require('express');
const router = express.Router();
const { getActionPlans, toggleTaskCompletion, createTask, deleteTask } = require('../controllers/actionPlanController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getActionPlans);
router.post('/', protect, createTask);
router.put('/:id/toggle', protect, toggleTaskCompletion);
router.delete('/:id', protect, deleteTask);

module.exports = router;

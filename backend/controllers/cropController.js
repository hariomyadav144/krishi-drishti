const Crop = require('../models/Crop');
const Farm = require('../models/Farm');

// @desc Get all crops for farmer
// @route GET /api/crops
const getCrops = async (req, res) => {
  try {
    const crops = await Crop.find({ farmerId: req.user._id }).sort({ isCurrent: -1, createdAt: -1 });
    res.json({ success: true, count: crops.length, data: crops });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add new crop
// @route POST /api/crops
const addCrop = async (req, res) => {
  try {
    const { cropName, variety, cropStage, areaAllocated, plantingDate, notes } = req.body;
    let farm = await Farm.findOne({ farmerId: req.user._id });
    if (!farm) {
      farm = await Farm.create({ farmerId: req.user._id, farmName: 'Primary Farm' });
    }

    const crop = await Crop.create({
      farmId: farm._id,
      farmerId: req.user._id,
      cropName,
      variety: variety || 'Standard High Yield',
      cropStage: cropStage || 'Vegetative Stage',
      areaAllocated: Number(areaAllocated) || 1.0,
      plantingDate: plantingDate || new Date(),
      healthStatus: 'Good',
      healthScore: 90,
      notes: notes || '',
      isCurrent: true,
    });

    res.status(201).json({ success: true, data: crop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update crop
// @route PUT /api/crops/:id
const updateCrop = async (req, res) => {
  try {
    let crop = await Crop.findOne({ _id: req.params.id, farmerId: req.user._id });
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    crop = await Crop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: crop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Set crop as active primary
// @route PUT /api/crops/:id/set-active
const setActiveCrop = async (req, res) => {
  try {
    await Crop.updateMany({ farmerId: req.user._id }, { isCurrent: false });
    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, farmerId: req.user._id },
      { isCurrent: true },
      { new: true }
    );
    res.json({ success: true, data: crop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete crop
// @route DELETE /api/crops/:id
const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findOneAndDelete({ _id: req.params.id, farmerId: req.user._id });
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }
    res.json({ success: true, message: 'Crop removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCrops,
  addCrop,
  updateCrop,
  setActiveCrop,
  deleteCrop,
};

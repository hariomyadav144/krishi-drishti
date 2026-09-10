const mongoose = require('mongoose');

const mandiRateSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    market: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    commodity: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    variety: {
      type: String,
      default: 'Standard / Other',
      trim: true
    },
    grade: {
      type: String,
      default: 'FAQ',
      trim: true
    },
    min_price: {
      type: Number,
      required: true
    },
    modal_price: {
      type: Number,
      required: true
    },
    max_price: {
      type: Number,
      required: true
    },
    arrival: {
      type: Number,
      default: 0
    },
    arrival_unit: {
      type: String,
      default: 'Tonnes'
    },
    unit: {
      type: String,
      default: 'Quintal'
    },
    source: {
      type: String,
      default: 'AGMARKNET / Data.gov.in'
    },
    source_authority: {
      type: String,
      default: 'Directorate of Marketing & Inspection, Ministry of Agriculture & Farmers Welfare, GoI'
    },
    source_url: {
      type: String,
      default: 'https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi'
    },
    source_date: {
      type: String, // Stored as YYYY-MM-DD or DD/MM/YYYY
      required: true,
      index: true
    },
    fetched_at: {
      type: Date,
      default: Date.now,
      index: true
    },
    is_valid: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Compound indexes for fast filtered lookups
mandiRateSchema.index({ state: 1, district: 1, market: 1, commodity: 1, source_date: -1 });
mandiRateSchema.index({ state: 1, district: 1, commodity: 1 });
mandiRateSchema.index({ source_date: -1 });

module.exports = mongoose.model('MandiRate', mandiRateSchema);

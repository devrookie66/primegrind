import mongoose, { Schema, InferSchemaType } from 'mongoose';

const linkSchema = new Schema(
  {
    url: { type: String, required: true },
    ownerUserId: { type: String, required: true, index: true },
    budget: { type: Number, required: true, default: 0, index: true },
    visitors: [{ type: String }],
    // Click tracking - her kullanıcı için verilen linkin click tracking bilgileri
    clickTracking: {
      type: Map,
      of: {
        token: String,           // Unique tracking token
        clicked: Boolean,        // Kullanıcı tracking linkine tıkladı mı?
        clickedAt: Date,        // Tıklama zamanı
        verified: Boolean,      // Kullanıcı verify butonuna bastı mı?
        verifiedAt: Date        // Verify zamanı
      },
      default: new Map()
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

linkSchema.index({ budget: -1, createdAt: 1 });

export type LinkDoc = InferSchemaType<typeof linkSchema> & { _id: mongoose.Types.ObjectId };

export const LinkModel = mongoose.models.Link || mongoose.model('Link', linkSchema);



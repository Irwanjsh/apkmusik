# =============================================
# Dockerfile — Backend API Pemutar Musik
# =============================================

# Gunakan image Node.js versi LTS yang ringan
FROM node:18-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Copy file package.json dan package-lock.json terlebih dahulu
# (agar layer cache Docker efisien saat dependencies tidak berubah)
COPY package*.json ./

# Install dependencies produksi
RUN npm install --omit=dev

# Copy seluruh source code backend ke dalam container
COPY . .

# Expose port yang digunakan aplikasi
EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["node", "server.js"]

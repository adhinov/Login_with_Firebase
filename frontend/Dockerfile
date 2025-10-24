# --- STAGE 1: Dependency Installation (Caches node_modules) ---
# Menggunakan base image Node.js yang stabil
FROM node:20-alpine AS deps

# Menentukan direktori kerja di dalam container
WORKDIR /app

# Menyalin file konfigurasi dependensi saja
# Ini adalah langkah KRITIS untuk Caching:
# Jika file-file ini tidak berubah, Docker tidak akan menjalankan "npm install" lagi.
COPY package.json package-lock.json ./

# Jalankan instalasi dependensi
RUN npm install

# --- STAGE 2: Build Application ---
FROM node:20-alpine AS builder

WORKDIR /app

# Menyalin dependensi yang sudah diinstal dari tahap "deps"
COPY --from=deps /app/node_modules ./node_modules
# Menyalin semua kode sumber aplikasi
COPY . .

# Menjalankan proses build Next.js
# NEXT_TELEMETRY_DISABLED=1 opsional, tetapi disarankan untuk lingkungan build
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# --- STAGE 3: Production Runtime (Lingkungan Paling Ringan) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Menginstal serve-handler dan dependensi ringan lainnya jika diperlukan
# Tetapi untuk Next.js, kita hanya membutuhkan Node.js dan hasil build
RUN npm install -g serve

# Next.js secara otomatis mengecualikan node_modules yang tidak perlu
# Menyalin node_modules yang dibutuhkan untuk runtime (minimal)
COPY --from=deps /app/node_modules/sharp ./node_modules/sharp
# Menyalin folder .next/standalone, .next/static, dan public
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# Menetapkan port (Railway akan menggunakan variabel PORT secara otomatis)
ENV PORT 3000

# Next.js Standalone
# Railway secara otomatis akan menjalankan `npm start` atau start command yang Anda tentukan
# Namun, secara default, ini adalah command untuk menjalankan server Next.js yang sudah di-build:
CMD ["npm", "start"]

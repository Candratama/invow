/**
 * Constant untuk tahun copyright
 * Menggunakan constant daripada new Date() untuk menghindari HMR issues
 */
export function CopyrightYear() {
  // Hardcode tahun untuk menghindari new Date() di client component
  // Akan di-update setiap tahun baru
  return <>2025</>;
}

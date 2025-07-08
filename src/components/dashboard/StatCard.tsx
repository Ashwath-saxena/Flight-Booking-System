// frontend/src/components/dashboard/StatCard.tsx
import { motion } from 'framer-motion';

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: string;
  delay?: number;
};

export default function StatCard({ label, value, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 180,
        damping: 18,
        delay
      }}
      whileHover={{ scale: 1.06, boxShadow: "0 8px 32px 0 rgba(26, 115, 232, 0.18)" }}
      className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-7 flex flex-col items-center border border-blue-100 hover:border-blue-400 transition-all duration-300"
    >
      <span className="text-4xl mb-2 animate-pulse">{icon}</span>
      <div className="text-3xl font-extrabold text-blue-700">{value}</div>
      <div className="text-gray-500 text-base mt-1 font-medium">{label}</div>
    </motion.div>
  );
}
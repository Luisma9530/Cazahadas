import { motion } from "framer-motion";
import { useModalStore } from "../../store/ModalStore";

export function BattleModal() {
  const [toggleBattleModal] = useModalStore((state) => [state.toggleBattleModal]);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 53 }}>
      <motion.div
        animate={{ 
          opacity: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0], 
          scaleY: [1, 1, 1, 1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.0], 
          scaleX: [0, 0, 1, 1, 1, 1, 1, 1.1, 1.2, 1.3] 
        }}
        transition={{ 
          duration: 4, 
          times: [0.0, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 1.0],
          delay: 0
        }}
        onAnimationComplete={() => {
          toggleBattleModal();
        }}
        className="border-y border-orange-400 bg-transparent text-center bg-gradient-to-r from-transparent via-[#ea580c_33%,_#ea580c_66%] to-transparent"
        style={{
          width: '600px',
          padding: '24px 0'  // py-6 → valor fijo
        }}
      >
        <motion.h2 
          animate={{ 
            opacity: [0, 0, 0.5, 1, 1, 1, 1, 1, 1, 1, 0], 
            scale: [0.8, 0.8, 0.9, 1, 1, 1, 1.1, 1.2, 1.3, 1.4, 1.5] 
          }}
          transition={{ 
            duration: 4, 
            times: [0.0, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 1.0],
            delay: 0
          }}
          className="font-normal text-orange-200"
          style={{ fontSize: '48px' }}  // text-5xl → valor fijo
        >
          Battle Started!
        </motion.h2>
      </motion.div>
    </div>
  );
}
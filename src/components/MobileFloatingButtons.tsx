import { Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MobileFloatingButtons = () => {
  const phoneNumber = '0522577194';
  const whatsappNumber = '972522577194'; // פורמט בינלאומי ללא +

  const handlePhoneClick = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  return (
    <>
      {/* כפתור WhatsApp - שמאל למטה */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        onClick={handleWhatsAppClick}
        className="fixed bottom-6 left-4 z-50 lg:hidden flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="WhatsApp"
      >
        <FaWhatsapp className="w-7 h-7" />
      </motion.button>

      {/* כפתור טלפון - ימין למטה */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        onClick={handlePhoneClick}
        className="fixed bottom-6 right-4 z-50 lg:hidden flex items-center justify-center w-14 h-14 bg-[#10B981] hover:bg-[#059669] text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Phone"
      >
        <Phone className="w-6 h-6" />
      </motion.button>
    </>
  );
};

export default MobileFloatingButtons;

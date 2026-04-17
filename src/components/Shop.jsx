import { useState, useEffect } from "react";
import { db, auth } from "../firebase/firebase";
import { doc, updateDoc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Books from "../assets/books.png";
import { ShoppingCart, Store } from "lucide-react";
import { motion } from "framer-motion";

const Shop = () => {
  const [showFinal, setShowFinal] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const comingSoonText = "COMING SOON";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(comingSoonText.slice(0, i + 1));
      i++;
      if (i === comingSoonText.length) {
        clearInterval(interval);
        setTimeout(() => setShowFinal(true), 500);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);  

  return (
    <section className="mt-18 p-4 bg-gray-100">
      <div className="border border-gray-200 bg-white shadow-2xl rounded-xl text-red-900 w-full min-h-screen flex flex-col items-center justify-center py-16 px-4 overflow-hidden">
        {!showFinal ? (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ duration: 1 }}
            className="flex items-center gap-8"
          >
            <ShoppingCart size={100} />
            <p className="text-6xl font-extrabold tracking-widest text-center">
              {displayText}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center">
            <Store size={100} className="mb-6" />
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-8xl font-extrabold tracking-widest text-center"
            >
              {comingSoonText}
            </motion.p>
          </div>
        )}
        <img src={Books} alt="Book" className="max-w-md w-full mt-6" />
      </div>
    </section>
  );
};

export default Shop;

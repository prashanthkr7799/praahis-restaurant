import italian from "../assets/marketing/italian.jpeg";
import japanese from "../assets/marketing/japanese.jpeg";
import indian from "../assets/marketing/indian.jpeg";

// New cuisine images
import arabicImage from "../assets/marketing/Arabic.jpg";
import multicusinImage from "../assets/marketing/multicusin.jpg";
import mananchuluImage from "../assets/marketing/mananchulu.jpg";
import chaiImage from "../assets/marketing/chai.jpg";

import { FaXTwitter, FaFacebook, FaInstagram } from "react-icons/fa6";

export const LINKS = [
  { text: "Dishes", targetId: "dishes" },
  { text: "About", targetId: "about" },
  { text: "Mission", targetId: "mission" },
  { text: "Expertise", targetId: "expertise" },
  { text: "Review", targetId: "review" },
  { text: "Contact", targetId: "contact" },
];

export const DISHES = [
  {
    image: arabicImage,
    title: "Arabic",
    description:
      "At Tabun, we prioritize your dining satisfaction. Our commitment lies in using the finest ingredients to create flavourful dishes that capture the essence of our cuisine. Your comfort and enjoyment are important to us, and our team is always here to help you find dishes that resonate with your tastes and needs.",
  },
  {
    image: multicusinImage,
    title: "Multicusine",
    description:
      "Our Breakfast menu is not limited just to dosas or idlis but also include traditional rural south Indian delicacies like ragi mudde,chicken/mutton curry, Nellore fish curries amongst others. Our South Indian dishes offer a delightful contrast of tangy, spicy, flavours that tantalize the taste buds.",
  },
  {
    image: mananchuluImage,
    title: "Mananchulu",
    description:
      "Our Breakfast menu is not limited just to dosas or idlis but also include traditional rural south Indian delicacies like ragi mudde,chicken/mutton curry, Nellore fish curries amongst others. Our South Indian dishes offer a delightful contrast of tangy, spicy, flavours that tantalize the taste buds.",
  },
  {
    image: chaiImage,
    title: "Chai",
    description:
      "Our Chai is made with a blend of black tea, spices, and milk. It is then brewed slowly over a fire, which gives its signature rich flavor and aroma. We also offer a variety of side dishes to complement our Chai, such as Samosas, Pakoras, and Momoss.",
  },
];

export const ABOUT = {
  header: "We love cooking!",
  content:
    "At Restaura, we believe that great food goes beyond taste; it tells a story of dedication and creativity. From our chef's signature creations to our attentive service, every detail is curated to ensure your visit is nothing short of exceptional. Whether you're savoring our renowned Tikka Kebab or exploring our diverse menu inspired by global flavors, each dish is a celebration of flavor and innovation. Join us for a culinary journey where every bite leaves a lasting impression. Experience Restaura—where every meal is a masterpiece.",
};

export const MISSION =
  "At our restaurant, our mission is to create delicious and memorable dining experiences.";

export const CUSINES = [
  {
    number: "01.",
    image: italian,
    title: "Italian",
    description:
      "Experience the flavors of Italy with our exquisite Italian cuisine, featuring traditional recipes and contemporary dishes.",
  },
  {
    number: "02.",
    image: japanese,
    title: "Japanese",
    description:
      "Delight in the art of Japanese culinary excellence, offering a fusion of classic and modern flavors.",
  },
  {
    number: "03.",
    image: indian,
    title: "Indian",
    description:
      "Indulge in the rich and diverse tastes of India, with a menu that celebrates the country's culinary heritage.",
  },
];

export const REVIEW = {
  name: "",
  profession: "Food Critic",
  content:
    "“As a seasoned food critic, my expectations are always high when stepping into a new dining establishment. Restaura, with its unassuming exterior and elegantly designed interior, promised a unique culinary experience from the moment I walked in. And I must say, it delivered beyond my expectations.”",
};

export const CONTACT = [
  { key: "address", value: "Address: 123 Tirupati, Andhra Pradesh, India, 517102" },
  { key: "phone", value: "Phone: 9676581878" },
  { key: "email", value: "Email: contact@restaurant.com" },
];

export const SOCIAL_MEDIA_LINKS = [
  {
    href: "https://x.com/",
    icon: <FaFacebook fontSize={30} className="hover:opacity-80" />,
  },

  {
    href: "https://x.com/",
    icon: <FaInstagram fontSize={30} className="hover:opacity-80" />,
  },
  {
    href: "https://x.com/",
    icon: <FaXTwitter fontSize={30} className="hover:opacity-80" />,
  },
];

export const pricingTiers = [
  { 
    name: "Basic", 
    price: "₹999/mo", 
    features: ["QR Ordering", "Kitchen Display", "Basic Analytics", "Email Support"] 
  },
  { 
    name: "Pro", 
    price: "₹1999/mo", 
    features: ["Analytics", "Offers & Discounts", "Live Updates", "Priority Support", "Multi-location"] 
  },
  { 
    name: "Premium", 
    price: "₹2999/mo", 
    features: ["Custom Branding", "Priority Support", "Advanced Analytics", "API Access", "Dedicated Manager"] 
  },
];

export const features = [
  { 
    title: "QR Code Ordering", 
    description: "Scan and order directly from your table",
    icon: "📱"
  },
  { 
    title: "Live Kitchen Updates", 
    description: "Track order progress in real-time",
    icon: "👨‍🍳"
  },
  { 
    title: "Secure Payments", 
    description: "Prepay using UPI or cards instantly",
    icon: "💳"
  },
  { 
    title: "Smart Analytics", 
    description: "Get detailed reports on sales & trends",
    icon: "📊"
  },
];

// Note: This needs to be updated with actual demo table UUID from database
// Run: SELECT id FROM tables WHERE table_number = 'demo';
// For now, we'll handle this dynamically in the components
export const demoTableId = null; // Will be fetched dynamically

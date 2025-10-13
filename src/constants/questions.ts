import { Question } from '@/types/daily-questions';

export const ALL_QUESTIONS: Question[] = [
  // Daily Experience with Photo
  { 
    id: "todayExperience", 
    text: "How was your day today? You can add a photo to help you remember.", 
    allowPhoto: true 
  },
  
  // Simple Personal Preferences
  { id: "favoriteColor", text: "What color do you like best?" },
  { id: "favoriteMeal", text: "Which meal do you like most?", choices: ["Breakfast", "Lunch", "Dinner"] },
  { id: "catsDogs", text: "Do you like cats or dogs?", choices: ["Cats", "Dogs", "Both"] },
  { id: "drinkPref", text: "What do you like to drink?", choices: ["Tea", "Coffee", "Water", "Juice"] },
  
  // Daily Feelings (Simple)
  { id: "smile", text: "What made you happy today?" },
  { id: "weather", text: "Do you like sunny days or rainy days?", choices: ["Sunny", "Rainy", "Both"] },
  { id: "calm", text: "What makes you feel calm and peaceful?" },
  
  // Home and Comfort
  { id: "favoriteSeat", text: "Where do you like to sit at home?" },
  { id: "favoriteRoom", text: "Which room in your home do you like best?" },
  
  // Memories from the Past (Simple)
  { id: "favoriteAsChild", text: "What did you like to do when you were young?" },
  { id: "firstJob", text: "What kind of work did you do?" },
  
  // Family (Simple and Clear)
  { id: "children", text: "Do you have children?", choices: ["Yes", "No"] },
  { id: "grandchildren", text: "Do you have grandchildren?", choices: ["Yes", "No"] },
  { id: "siblings", text: "Do you have brothers or sisters?", choices: ["Yes", "No"] },
  
  // Basic Identity
  { id: "fullName", text: "What is your name?" },
  { id: "birthday", text: "When is your birthday?" },
  { id: "born", text: "Where were you born?" },
  { id: "parentsNames", text: "What were your parents' names?" },
  { id: "married", text: "Are you married or were you married?", choices: ["Yes", "No", "Was married"] },
];

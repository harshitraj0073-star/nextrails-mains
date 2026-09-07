type Language = 'en' | 'hi' | 'bn';

export const translations = {
  en: {
    login: {
      title: "Secure Access",
      subtitle: "Dynamic Mental Health Monitoring System",
      mobile: "Mobile Number / Email",
      password: "Password / OTP",
      signIn: "Sign In",
      privacyNotice: "Your information is protected and is only accessible to authorised personnel.",
    },
    victim: {
      greeting: "Your wellbeing matters.",
      askFeeling: "How are you feeling today?",
      startCheckIn: "Start Check-in",
      talkToCounsellor: "Talk to a Counsellor",
      requestCall: "Request a Call",
      getSupport: "Get Support",
      caseStatus: "Case Status",
      responsesRecorded: "Your responses have been securely recorded. A member of your support team may contact you if follow-up is needed."
    }
  },
  hi: {
    login: {
      title: "सुरक्षित पहुंच",
      subtitle: "मानसिक स्वास्थ्य निगरानी प्रणाली",
      mobile: "मोबाइल नंबर / ईमेल",
      password: "पासवर्ड / ओटीपी",
      signIn: "साइन इन करें",
      privacyNotice: "आपकी जानकारी सुरक्षित है।",
    },
    victim: {
      greeting: "आपकी भलाई मायने रखती है।",
      askFeeling: "आज आप कैसा महसूस कर रहे हैं?",
      startCheckIn: "चेक-इन शुरू करें",
      talkToCounsellor: "काउंसलर से बात करें",
      requestCall: "कॉल का अनुरोध करें",
      getSupport: "समर्थन प्राप्त करें",
      caseStatus: "मामले की स्थिति",
      responsesRecorded: "आपकी प्रतिक्रियाएं सुरक्षित रूप से रिकॉर्ड कर ली गई हैं।"
    }
  },
  bn: {
    login: {
      title: "নিরাপদ অ্যাক্সেস",
      subtitle: "মানসিক স্বাস্থ্য পর্যবেক্ষণ সিস্টেম",
      mobile: "মোবাইল নম্বর / ইমেইল",
      password: "পাসওয়ার্ড / ওটিপি",
      signIn: "সাইন ইন করুন",
      privacyNotice: "আপনার তথ্য সুরক্ষিত।",
    },
    victim: {
      greeting: "আপনার সুস্থতা গুরুত্বপূর্ণ।",
      askFeeling: "আজ আপনি কেমন অনুভব করছেন?",
      startCheckIn: "চেক-ইন শুরু করুন",
      talkToCounsellor: "কাউন্সেলরের সাথে কথা বলুন",
      requestCall: "একটি কলের জন্য অনুরোধ করুন",
      getSupport: "সমর্থন পান",
      caseStatus: "মামলার অবস্থা",
      responsesRecorded: "আপনার প্রতিক্রিয়া নিরাপদে রেকর্ড করা হয়েছে।"
    }
  }
};

export const useTranslation = (lang: Language = 'en') => {
  return (keyPath: string) => {
    const keys = keyPath.split('.');
    let current: any = translations[lang] || translations['en'];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        // Fallback to English if key doesn't exist in target language
        let fallback = (translations['en'] as any);
        for (const k of keys) {
          if (fallback[k] === undefined) return keyPath;
          fallback = fallback[k];
        }
        return fallback;
      }
      current = current[key];
    }
    return current;
  };
};

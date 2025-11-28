
import { KBILDQuestion } from './types';

export const PRIMARY_DIAGNOSIS_CATEGORIES = [
  "Interstitial Lung Disease (ILD)",
  "Obstructive Airway Disease (OAD)",
  "Bronchiectasis"
];

export const ILD_SUBTYPES = [
  "Idiopathic pulmonary fibrosis",
  "Hypersensitivity pneumonitis",
  "Idiopathic NSIP",
  "CTD-ILD",
  "IPAF",
  "Sarcoidosis",
  "Occupational ILD",
  "COP",
  "RB-ILD",
  "DIP",
  "AIP",
  "Idiopathic pleuro-parenchymal fibroelastosis",
  "LIP",
  "LCH",
  "LAM",
  "Eosinophilic pneumonia"
];

export const OAD_SUBTYPES = [
  "COPD",
  "Asthma",
  "Asthma-COPD Overlap (ACO)",
  "Bronchiolitis Obliterans",
  "Other OAD"
];

export const BRONCHIECTASIS_SUBTYPES = [
  "Post-infectious",
  "Cystic Fibrosis related",
  "ABPA related",
  "Primary Ciliary Dyskinesia",
  "Idiopathic",
  "Other"
];

// Backward compatibility alias, defaults to ILD list
export const DIAGNOSIS_LIST = ILD_SUBTYPES;

export const CTD_TYPES = [
  "Scleroderma",
  "Rheumatoid arthiritis",
  "SLE",
  "Dermatomyositis",
  "Polymyosistis",
  "MCTD",
  "Others"
];

export const SARCOIDOSIS_STAGES = [
  "Stage 1",
  "Stage 2",
  "Stage 3",
  "Stage 4"
];

export const CO_MORBIDITIES_LIST = [
  "Diabetes Mellitus",
  "Hypertension",
  "GERD",
  "Obstructive Sleep Apnea",
  "Coronary Artery Disease",
  "Pulmonary Hypertension",
  "Hypothyroidism",
  "Osteoporosis",
  "Depression",
  "Anxiety",
  "Chronic Kidney Disease (CKD)",
  "Chronic Liver Disease (CLD)",
  "Past history of Pulmonary TB",
  "Hepatitis B",
  "Hepatitis C",
  "HIV",
  "Others"
];

export const MEDICATION_LIST = [
  "Wysolone",
  "MMF",
  "Azathoprine",
  "Methotrexate",
  "Rituximab",
  "Nintedanib",
  "Perfinedone",
  "Bronchodilator",
  "IVIG",
  "Other"
];

export const FREQUENCY_LIST = [
  "OD",
  "BD",
  "TDS",
  "Once a week",
  "Once a month",
  "Induction first dose",
  "Induction 2nd dose",
  "Maintenance dose"
];

export const MMRC_GRADES = [
  { value: "0", en: "Grade 0: I only get breathless with strenuous exercise.", hi: "ग्रेड 0: मुझे केवल ज़ोरदार व्यायाम करने पर ही सांस फूलती है।" },
  { value: "1", en: "Grade 1: I get short of breath when hurrying on the level or walking up a slight hill.", hi: "ग्रेड 1: समतल पर जल्दी चलने या हल्की चढ़ाई चढ़ने पर मेरी सांस फूलती है।" },
  { value: "2", en: "Grade 2: I walk slower than people of the same age on the level because of breathlessness, or I have to stop for breath when walking on my own pace on the level.", hi: "ग्रेड 2: सांस फूलने के कारण मैं समतल पर अपनी उम्र के लोगों से धीमे चलता हूँ, या अपने आप चलते समय मुझे सांस लेने के लिए रुकता हूँ।" },
  { value: "3", en: "Grade 3: I stop for breath after walking about 100 meters or after a few minutes on the level.", hi: "ग्रेड 3: मैं लगभग 100 मीटर चलने के बाद या कुछ मिनटों के बाद सांस लेने के लिए रुकता हूँ।" },
  { value: "4", en: "Grade 4: I am too breathless to leave the house or I am breathless when dressing or undressing.", hi: "ग्रेड 4: मेरी सांस इतनी फूलती है कि मैं घर से बाहर नहीं निकल सकता या कपड़े पहनते/उतारते समय भी सांस फूलती है।" },
];

export const SIDE_EFFECTS = [
  "Nausea (जी मिचलाना)",
  "Vomiting (उल्टी)",
  "Diarrhea (दस्त)",
  "Fever (बुखार)",
  "Headache (सिरदर्द)",
  "Abdominal Pain (पेट दर्द)",
  "Rashes (चकत्ते)"
];

export const SYMPTOMS_HINDI: Record<string, string> = {
  cough: "खांसी",
  expectoration: "बलगम",
  breathlessness: "सांस फूलना",
  chest_pain: "छाती में दर्द",
  hemoptysis: "खून की उल्टी / बलगम में खून",
  fever: "बुखार",
  ctd_symptoms: "सीटीडी लक्षण"
};

export const KBILD_OPTIONS = {
  frequency_1: [
    { val: 1, label: "Every time", labelHi: "हर बार" },
    { val: 2, label: "Most times", labelHi: " अधिकांश समय" },
    { val: 3, label: "Several times", labelHi: "बहुत बार" },
    { val: 4, label: "Some times", labelHi: "कभी-कभी" },
    { val: 5, label: "Occasionally", labelHi: "कभी न कभी" },
    { val: 6, label: "Rarely", labelHi: "शायद ही कभी" },
    { val: 7, label: "Never", labelHi: "कभी नहीं" },
  ],
  frequency_2: [
    { val: 1, label: "All of the time", labelHi: "हर समय" },
    { val: 2, label: "Most of the time", labelHi: "सर्वाधिक समय" },
    { val: 3, label: "A good bit of the time", labelHi: "समय का अच्छा क्षण" },
    { val: 4, label: "Some of the time", labelHi: "कुछ समय" },
    { val: 5, label: "A little of the time", labelHi: "थोड़ा समय" },
    { val: 6, label: "Hardly any of the time", labelHi: "शायद ही कभी" },
    { val: 7, label: "None of the time", labelHi: "कभी नहीं" },
  ],
  control: [
    { val: 1, label: "None of the time", labelHi: "कभी नहीं" },
    { val: 2, label: "Hardly any of the time", labelHi: "शायद ही कभी" },
    { val: 3, label: "A little of the time", labelHi: "थोड़ा समय" },
    { val: 4, label: "Some of the time", labelHi: "कुछ समय" },
    { val: 5, label: "A good bit of the time", labelHi: "समय का अच्छा क्षण" },
    { val: 6, label: "Most of the time", labelHi: "सर्वाधिक समय" },
    { val: 7, label: "All of the time", labelHi: "हर समय" },
  ],
  amount: [
    { val: 1, label: "A significant amount", labelHi: "बहुत बड़ी मात्रा में" },
    { val: 2, label: "A large amount", labelHi: "बड़ी मात्रा में" },
    { val: 3, label: "A considerable amount", labelHi: "काफी मात्रा में" },
    { val: 4, label: "A reasonable amount", labelHi: "उचित मात्रा में" },
    { val: 5, label: "A small amount", labelHi: "छोटी मात्रा में" },
    { val: 6, label: "Hardly at all", labelHi: "मुश्किल से ही" },
    { val: 7, label: "Not at all", labelHi: "हरगिज़ नहीं" },
  ]
};

export const KBILD_QUESTIONS: KBILDQuestion[] = [
  { id: 1, textEn: "In the last 2 weeks, I have been breathless climbing stairs or walking up an incline or hill.", textHi: "पिछले 2 सप्ताह में, मुझे सीढ़ियां चढ़ने या एक झुकाव या पहाड़ी पर चलने से मेरा सांस फूल रहा है।", optionType: 'frequency_1' },
  { id: 2, textEn: "In the last 2 weeks, because of my lung condition, my chest has felt tight.", textHi: "पिछले 2 सप्ताह में, फेफड़ों की स्थिति के कारण मेरी छाती में जकड़न महसूस हुई है?", optionType: 'frequency_2' },
  { id: 3, textEn: "In the last 2 weeks have you worried about the seriousness of your lung complaint?", textHi: "क्या पिछले 2 सप्ताह से आप फेफड़े की रोग की गंभीरता से चिंतित हैं?", optionType: 'frequency_2' },
  { id: 4, textEn: "In the last 2 weeks have you avoided doing things that make you breathless?", textHi: "पिछले 2 सप्ताह में, क्या आपने उन चीजों के सेवन से परहेज किया है जिनसे सांस फूलती है?", optionType: 'frequency_2' },
  { id: 5, textEn: "In the last 2 weeks have you felt in control of your lung condition?", textHi: "पिछले 2 सप्ताह में, क्या आपने महसूस किया कि फेफड़ों की स्थिति नियंत्रण में है?", optionType: 'control' },
  { id: 6, textEn: "In the last 2 weeks, has your lung complaint made you feel fed up or down in the dumps?", textHi: "पिछले 2 सप्ताह में, आपको फेफड़ों की परेशानी ने आपको डंप या तंग किया है?", optionType: 'frequency_2' },
  { id: 7, textEn: "In the last 2 weeks, I have felt the urge to breathe, also known as ‘air hunger’.", textHi: "पिछले 2 सप्ताह में, मैंने सांस लेने की तीव्र इच्छा महसूस किया है जिसे 'वायु की भूख' भी कहा जाता है।", optionType: 'frequency_2' },
  { id: 8, textEn: "In the last 2 weeks, my lung condition has made me feel anxious.", textHi: "पिछले 2 सप्ताह में, मेरे फेफड़ों की स्थिति ने मुझे चिंतित किया है?", optionType: 'frequency_2' },
  { id: 9, textEn: "In the last 2 weeks, how often have you experienced ‘wheeze’ or whistling sounds from your chest?", textHi: "पिछले 2 सप्ताह में, आपने कितनी बार फेफड़ों में घरघराहट या सीटी बजने का अनुभव किया है?", optionType: 'frequency_2' },
  { id: 10, textEn: "In the last 2 weeks, how much of the time have you felt your lung disease is getting worse?", textHi: "पिछले 2 सप्ताह में, आपने कितना समय महसूस किया है कि आपके फेफड़ों की बीमारी बदतर हो रही है?", optionType: 'frequency_2' },
  { id: 11, textEn: "In the last 2 weeks has your lung condition interfered with your job or other daily tasks?", textHi: "क्या पिछले 2 सप्ताह में, आपके फेफड़ों की स्थिति ने आपकी नौकरी या अन्य दैनिक कार्यों में हस्तक्षेप किया है?", optionType: 'frequency_2' },
  { id: 12, textEn: "In the last 2 weeks have you expected your lung complaint to get worse?", textHi: "क्या पिछले 2 सप्ताह में, आपने अपने फेफड़ों की रोग को और खराब होने की उम्मीद की है?", optionType: 'frequency_2' },
  { id: 13, textEn: "In the last 2 weeks, how much has your lung condition limited you carrying things, for example, groceries?", textHi: "पिछले 2 सप्ताह में, आपके फेफड़ों की स्थिति ने आपके द्वारा ले जाने वाली चीजों को कितना सीमित कर दिया है?", optionType: 'frequency_2' },
  { id: 14, textEn: "In the last 2 weeks, has your lung condition made you think more about the end of your life?", textHi: "पिछले 2 सप्ताह में, आपके फेफड़ों की स्थिति ने आपको अपने जीवन के अंत के बारे में अधिक सोचने के लिए प्रेरित किया है?", optionType: 'frequency_2' },
  { id: 15, textEn: "Are you financially worse off because of your lung condition?", textHi: "क्या आप अपने फेफड़ों की स्थिति के कारण आंशिक रूप से बुरे हालात में हैं?", optionType: 'amount' },
];

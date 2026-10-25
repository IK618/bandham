"""
De-duplicates all profile first names across the database.
Preserves Ananya and Rohan demo profiles, and ensures every single profile
gets a completely distinct, authentic name matching their gender.
"""

import asyncio
from sqlalchemy import select, func, and_
from backend.app.core.database import AsyncSessionLocal
from backend.app.models.profile import Profile, GenderEnum
from backend.app.models.user import User

FEMALE_NAMES = [
    "Aaditri", "Aafreen", "Aakanksha", "Aalia", "Aanya", "Aaradhya", "Aarohi", "Aastha",
    "Adhira", "Aditi", "Advika", "Ahana", "Aindrila", "Aishwarya", "Akanksha", "Akhila",
    "Alaknanda", "Alankrita", "Alia", "Alisha", "Alka", "Amala", "Amara", "Ambika", "Amishi",
    "Amrita", "Anamika", "Ananya", "Anaya", "Anchal", "Anika", "Anindita", "Anita", "Anjali",
    "Anjana", "Ankita", "Anmol", "Annapurna", "Anokhi", "Anoushka", "Anshika", "Antara",
    "Anu", "Anupama", "Anuradha", "Anusha", "Anushka", "Aparna", "Archana", "Arpita", "Arshia",
    "Arti", "Arundhati", "Arya", "Ashima", "Ashna", "Ashrita", "Asmita", "Avani", "Avantika",
    "Avishi", "Avni", "Ayanna", "Ayushi", "Barkha", "Barsha", "Bela", "Bhagyashree", "Bhairavi",
    "Bhanupriya", "Bharati", "Bhavana", "Bhavika", "Bhavna", "Bhavya", "Bhumika", "Bindiya",
    "Binita", "Bipasha", "Brinda", "Chaitali", "Champa", "Chanchal", "Chandana", "Chandani",
    "Chandini", "Chandra", "Chandrika", "Charu", "Charulata", "Charvi", "Chhavi", "Chhaya",
    "Chitra", "Damini", "Damyanti", "Darshana", "Daya", "Deeksha", "Deepa", "Deepali", "Deepika",
    "Deepshikha", "Deepti", "Devaki", "Devangi", "Devanshi", "Devashree", "Devika", "Devyani",
    "Dhanya", "Dhara", "Dharitri", "Dharini", "Dhriti", "Dhwani", "Diksha", "Dilruba", "Disha",
    "Dishani", "Divija", "Divya", "Divyanshi", "Diya", "Drishti", "Durva", "Eesha", "Ekta",
    "Ela", "Esha", "Eshana", "Eshani", "Garima", "Gauri", "Gautami", "Gayatri", "Geeta",
    "Geetanjali", "Geetika", "Gitanjali", "Gopi", "Grishma", "Gunjan", "Hamsini", "Hansika",
    "Harini", "Harita", "Harshada", "Harshita", "Heena", "Hema", "Hemangi", "Hemani", "Hemlata",
    "Himani", "Hina", "Hiral", "Hita", "Hradini", "Hridya", "Ila", "Indira", "Indrani",
    "Indu", "Ipshita", "Ira", "Isha", "Ishana", "Ishani", "Ishanvi", "Ishita", "Jagriti",
    "Jahnavi", "Jaimala", "Janaki", "Janki", "Jasleen", "Jasmine", "Jaya", "Jayanti", "Jayashree",
    "Jayna", "Jeevika", "Jhanvi", "Jheel", "Jigisha", "Jinal", "Jivika", "Juhi", "Jyoti",
    "Jyotsna", "Kadambari", "Kajal", "Kala", "Kalindi", "Kalpana", "Kalyani", "Kamakshi",
    "Kamala", "Kamini", "Kamna", "Kanchan", "Kanupriya", "Karishma", "Karuna", "Kashish",
    "Kashvi", "Kasturi", "Kaumudi", "Kausalya", "Kaveri", "Kavita", "Kavya", "Ketaki",
    "Khushboo", "Khushi", "Kinnari", "Kiran", "Kirti", "Komal", "Koyal", "Krina", "Kripa",
    "Krishna", "Kriti", "Kritika", "Krutika", "Kshama", "Kumkum", "Kumud", "Kusum", "Ladli",
    "Lakshmi", "Lalita", "Lata", "Lavanya", "Leela", "Leelavati", "Lekha", "Lipika", "Madhavi",
    "Madhu", "Madhubala", "Madhur", "Madhuri", "Mahak", "Mahima", "Mahira", "Maitreyi",
    "Malati", "Malavika", "Malini", "Mallika", "Mamta", "Manali", "Mandakini", "Mandira",
    "Maneka", "Mangala", "Manini", "Manisha", "Manjari", "Manju", "Manjula", "Manjusha",
    "Mansi", "Manyata", "Mayuri", "Medha", "Meena", "Meenakshi", "Meenal", "Meera", "Megha",
    "Meghana", "Mihika", "Minal", "Mira", "Mithila", "Mohini", "Moksha", "Mridula", "Mrinal",
    "Mrinalini", "Mukta", "Mythili", "Naina", "Nalini", "Namita", "Namrata", "Nandana",
    "Nandini", "Nandita", "Navya", "Neela", "Neelam", "Neelanjana", "Neena", "Neeraja",
    "Neeta", "Neetu", "Neha", "Netra", "Nidhi", "Nihira", "Nikita", "Nimisha", "Nirja",
    "Nirmala", "Nisha", "Nishita", "Niti", "Nitika", "Nitya", "Nivedita", "Niyati", "Nupur",
    "Nutan", "Ojasvi", "Ojaswini", "Padma", "Padmini", "Palak", "Pallavi", "Pankhuri",
    "Parinita", "Parul", "Parvati", "Payal", "Pooja", "Poonam", "Poorva", "Prachi", "Pragati",
    "Pragya", "Pranjal", "Prarthana", "Pratibha", "Pratima", "Pratyusha", "Preeti", "Prerana",
    "Priti", "Priya", "Priyanka", "Purnima", "Purvi", "Pushpa", "Rachana", "Radha", "Radhika",
    "Ragini", "Rajashree", "Rajeshwari", "Rakhi", "Rakshita", "Rama", "Ramya", "Rani",
    "Ranjana", "Rashmi", "Rati", "Raveena", "Reena", "Rekha", "Renu", "Renuka", "Reshma",
    "Revathi", "Riddhi", "Rina", "Rishika", "Rita", "Ritu", "Rituparna", "Riya", "Rohini",
    "Roma", "Roshni", "Ruchi", "Ruchika", "Ruhani", "Rukmini", "Rupa", "Rupali", "Saanvi",
    "Sachi", "Sadhana", "Sahana", "Sakshi", "Saloni", "Samaira", "Samiksha", "Samira",
    "Samriddhi", "Sana", "Sanchita", "Sandhya", "Sangeeta", "Sanjana", "Sanjita", "Sanskriti",
    "Sanya", "Sapna", "Sarita", "Saroj", "Sarojini", "Saumya", "Savita", "Savitri", "Seema",
    "Seerat", "Shailaja", "Shalini", "Shanaya", "Shanta", "Shanti", "Sharada", "Sharmila",
    "Shashi", "Sheela", "Sheetal", "Shikha", "Shilpa", "Shipra", "Shivangi", "Shivani",
    "Shobha", "Shobhana", "Shreya", "Shraddha", "Shravani", "Shriya", "Shruti", "Shubha",
    "Shweta", "Siddhi", "Simran", "Sita", "Smita", "Smriti", "Sneha", "Snehal", "Snigdha",
    "Sonakshi", "Sonali", "Soni", "Sonia", "Soumya", "Spandana", "Srishti", "Stuti",
    "Subhashini", "Suchitra", "Sudha", "Sujata", "Sukanya", "Sulochana", "Suman", "Sumitra",
    "Sunanda", "Sunita", "Supriya", "Surabhi", "Surekha", "Sushila", "Sushma", "Swapna",
    "Swati", "Tanisha", "Tanu", "Tanuja", "Tanushree", "Tanvi", "Tara", "Tarini", "Tejal",
    "Tejaswini", "Trisha", "Tulsi", "Uma", "Upasana", "Urmi", "Urmila", "Urvashi", "Urvi",
    "Usha", "Vaishali", "Vaishnavi", "Vandana", "Vani", "Vanita", "Varsha", "Vasudha",
    "Vasundhara", "Vedika", "Vibha", "Vidhi", "Vidisha", "Vidya", "Vijaya", "Vinita",
    "Vrinda", "Yamini", "Yashasvi", "Yashoda", "Yashodhara", "Yukta", "Yuvika", "Zoya",
    "Aanvi", "Aaratrika", "Aarshia", "Aashna", "Abhilasha", "Akshita", "Amulya", "Anagha",
    "Ananmya", "Ananyaa", "Anurati", "Arundhatii", "Ashwina", "Asmitaa", "Bhavisha", "Chaitra",
    "Charanya", "Darshita", "Deepna", "Devanandana", "Dharmita", "Dharshini", "Dhruvi",
    "Elakshi", "Falguni", "Gopika", "Hansaveni", "Harshika", "Hasini", "Iksheeta", "Iniya",
    "Ishitva", "Jaghavi", "Janya", "Kairavi", "Kanaklata", "Kashyapi", "Kavishri", "Keya",
    "Kusumita", "Laksheeta", "Lipakshi", "Madhulikaa", "Manashree", "Medhasvi", "Mrinalee",
    "Nandhika", "Netravati", "Niharika", "Nilakshi", "Niranjana", "Nirupama", "Nishika",
    "Nityasri", "Nivedhitha", "Padmapriya", "Pranali", "Pranati", "Prathiksha", "Priyamvada",
    "Raadhika", "Radhamani", "Rajalakshmi", "Riddhima", "Rithika", "Rohinipriya", "Roshnara",
    "Sahasra", "Samhita", "Sampada", "Samyuktha", "Sanjivani", "Sathvika", "Sharvari",
    "Shatakshi", "Shresthi", "Shubhangi", "Sinjini", "Soundarya", "Srilekha", "Subbalakshmi",
    "Sucharita", "Sukruthi", "Swarnima", "Tanmayi", "Tejasri", "Trishika", "Vaidehi",
    "Varshini", "Vedavalli", "Vennela", "Vibhuthi", "Vidhatri", "Vijayasri", "Vipanchi",
    "Visalakshi", "Vrishtee", "Yashmita", "Yogitha", "Yukthi"
]

MALE_NAMES = [
    "Aadi", "Aaditya", "Aakash", "Aamir", "Aanand", "Aarav", "Aarin", "Aarush", "Aashish",
    "Abhay", "Abhi", "Abhijit", "Abhinav", "Abhishek", "Abhimanyu", "Achal", "Achyut",
    "Adarsh", "Adhiraj", "Adit", "Aditya", "Advait", "Advay", "Agastya", "Ajay", "Ajit",
    "Akhil", "Akshat", "Akshay", "Alok", "Aman", "Amar", "Amartya", "Amber", "Ambuj",
    "Amish", "Amit", "Amitabh", "Amol", "Anand", "Anang", "Anant", "Anay", "Aneesh",
    "Angad", "Anil", "Aniket", "Aniruddha", "Anirudh", "Anish", "Ankit", "Ankur", "Anmol",
    "Anoop", "Ansh", "Anshul", "Anuj", "Anupam", "Anurag", "Anvay", "Apurva", "Arav",
    "Aravind", "Archit", "Arghya", "Arihant", "Arijit", "Arin", "Arindam", "Arjun", "Arman",
    "Arnav", "Arup", "Arvind", "Aryan", "Asad", "Ashis", "Ashish", "Ashok", "Ashutosh",
    "Ashvin", "Ashwin", "Asim", "Atal", "Atiksh", "Atul", "Avanindra", "Avik", "Avinash",
    "Avi", "Ayush", "Babul", "Balachandar", "Balaji", "Balamurugan", "Baldev", "Balraj",
    "Balram", "Balwant", "Banwari", "Basant", "Basavaraj", "Bhagat", "Bhagirath", "Bhagwan",
    "Bhairav", "Bhanu", "Bharat", "Bhargav", "Bhaskar", "Bhavesh", "Bhim", "Bholanath",
    "Bhuvan", "Bhuvanesh", "Bikash", "Bikram", "Bimal", "Bipin", "Birendra", "Biswajit",
    "Bodhi", "Brij", "Brijesh", "Chaitanya", "Chakradhar", "Chaman", "Chanchal", "Chandan",
    "Chander", "Chandra", "Chandrakant", "Chandrashekar", "Charan", "Charanjeet", "Charudatta",
    "Chetan", "Chidambaram", "Chinmay", "Chirag", "Chiranjeev", "Chittaranjan", "Daksh",
    "Dakshesh", "Damodar", "Danesh", "Daniel", "Danish", "Darpan", "Darshan", "Dayanand",
    "Debashis", "Debjit", "Deepak", "Deependra", "Deeptanshu", "Dev", "Devadatta", "Devang",
    "Devendra", "Devesh", "Devraj", "Dhananjay", "Dhanraj", "Dharam", "Dharamraj", "Dharmendra",
    "Dhawal", "Dhiren", "Dhirendra", "Dhruv", "Digambar", "Digvijay", "Dilip", "Dinesh",
    "Dipak", "Dipankar", "Divyanshu", "Divyesh", "Durgesh", "Dushyant", "Eashan", "Eklavya",
    "Eshwar", "Faisal", "Farhan", "Feroz", "Gagan", "Gajendra", "Gananath", "Ganesh", "Gaurang",
    "Gaurav", "Gautam", "Geetan", "Ghanshyam", "Girdhari", "Giridhar", "Girish", "Gopal",
    "Gopinath", "Govind", "Govinda", "Gulab", "Gulshan", "Gurcharan", "Gurdas", "Gurdeep",
    "Gurinder", "Gurmeet", "Gurpreet", "Gyan", "Gyanendra", "Hardik", "Hari", "Harikrishnan",
    "Harinath", "Harish", "Harjeet", "Harminder", "Harpal", "Harpreet", "Harsh", "Harsha",
    "Harshavardhan", "Harshit", "Hemant", "Hemendra", "Himesh", "Himmat", "Himanshu", "Hiranmay",
    "Hiren", "Hitesh", "Hriday", "Hrishikesh", "Imran", "Inder", "Inderjit", "Indrajit",
    "Indranil", "Ishan", "Ishant", "Ishwar", "Jagadish", "Jagat", "Jagdish", "Jagjit", "Jaideep",
    "Jaidev", "Jai", "Jairam", "Jatin", "Jay", "Jayant", "Jayendra", "Jayesh", "Jeevan",
    "Jeetendra", "Jignesh", "Jitendra", "Jivan", "Joginder", "Jugal", "Kabir", "Kailash",
    "Kalidas", "Kalyan", "Kamal", "Kamalakar", "Kamalesh", "Kamesh", "Kanak", "Kanishk",
    "Kapil", "Karan", "Kartar", "Kartik", "Karthik", "Karun", "Kashi", "Kaushal", "Kaushik",
    "Kavi", "Kaviraj", "Kedarnath", "Keshav", "Ketan", "Khushal", "Kiran", "Kirit", "Kirtan",
    "Kishore", "Kripal", "Krishna", "Krishnamurthy", "Krishnan", "Kshitij", "Kuldeep", "Kuljit",
    "Kumar", "Kundan", "Kunal", "Kush", "Kushal", "Lakshman", "Lakshya", "Lalit", "Lallan",
    "Lav", "Lokesh", "Madan", "Madhav", "Madhu", "Madhusudan", "Mahadev", "Mahavir", "Mahendra",
    "Mahesh", "Mahinder", "Malay", "Malkiat", "Mallikarjun", "Manas", "Mandar", "Maneesh",
    "Mangal", "Mangesh", "Mani", "Maninder", "Manish", "Manjeet", "Manmohan", "Manoj", "Manpreet",
    "Mansukh", "Mayank", "Mayur", "Meenesh", "Meet", "Mehul", "Milan", "Milind", "Mir", "Mithilesh",
    "Mithun", "Mitul", "Mohak", "Mohan", "Mohit", "Moolchand", "Mukand", "Mukesh", "Mukul",
    "Murali", "Murari", "Murugesan", "Nafees", "Nagaraj", "Nagesh", "Nakul", "Nalin", "Naman",
    "Namdev", "Nandan", "Narain", "Naran", "Narendra", "Naresh", "Narottam", "Narsingh", "Nataraj",
    "Naveen", "Navin", "Navneet", "Navjot", "Neel", "Neelkanth", "Neeraj", "Nihal", "Nikhil",
    "Nilesh", "Nimish", "Ninad", "Nipun", "Nirad", "Niraj", "Niramay", "Niranjan", "Nirbhay",
    "Nirmal", "Nirvan", "Nishant", "Nishikant", "Nishith", "Nitin", "Nityanand", "Nripendra",
    "Ojas", "Om", "Omprakash", "Padam", "Padmanabh", "Palash", "Pallav", "Pankaj", "Paras",
    "Paresh", "Parikshit", "Paritosh", "Parminder", "Parth", "Partha", "Parv", "Parveen",
    "Pawan", "Piyush", "Prabhat", "Prabhu", "Prabir", "Prabodh", "Pradeep", "Pradyumna",
    "Prafulla", "Pragyan", "Prahlad", "Prakash", "Pramod", "Pran", "Pranav", "Pranay", "Prashant",
    "Prateek", "Pratham", "Pratik", "Praveen", "Pravin", "Prem", "Pritam", "Pritesh", "Prithviraj",
    "Priyadarshan", "Priyam", "Priyanshu", "Puneet", "Punit", "Puran", "Purushottam", "Pushkar",
    "Pushpendra", "Rachit", "Radhakrishnan", "Radheshyam", "Raghav", "Raghavendra", "Raghu",
    "Raghubir", "Raghunath", "Rahul", "Raj", "Rajan", "Rajat", "Rajeev", "Rajendra", "Rajesh",
    "Rajinder", "Rajiv", "Rajneesh", "Rakesh", "Raktim", "Ram", "Ramakant", "Raman", "Ramanath",
    "Ramanuja", "Ramesh", "Rameshwar", "Ramkumar", "Randeep", "Ranganath", "Ranjan", "Ranjeet",
    "Ranjit", "Ratan", "Ratnakar", "Rauf", "Ravi", "Ravichandran", "Ravindra", "Ravish", "Rayan",
    "Rishabh", "Rishi", "Rishikesh", "Ritesh", "Rituraj", "Robin", "Rohan", "Rohit", "Ronit",
    "Roshan", "Rounak", "Rudra", "Rupak", "Rupesh", "Rushil", "Sachin", "Sadanand", "Sagar",
    "Sahil", "Sai", "Sajal", "Sajid", "Saket", "Samar", "Samarth", "Sambhav", "Sameer", "Samir",
    "Sampat", "Samrat", "Sandeep", "Sandip", "Sangram", "Sanjay", "Sanjeev", "Sankalp", "Sanket",
    "Santosh", "Sarang", "Saravanan", "Sarthak", "Sarvesh", "Satendra", "Sathyan", "Satish",
    "Satnam", "Satvik", "Satyajit", "Satyam", "Satyendra", "Saurabh", "Saurav", "Savan", "Sayed",
    "Shailen", "Shailendra", "Shailesh", "Shamik", "Shankar", "Shanker", "Shanmugam", "Shantanu",
    "Sharad", "Sharat", "Sharman", "Shashank", "Shashi", "Shashikant", "Shatrughan", "Shaurya",
    "Shekhar", "Shiv", "Shivam", "Shivanand", "Shivendra", "Shobhit", "Shravan", "Shrenik",
    "Shreshth", "Shrikant", "Shrinath", "Shrinivas", "Shriram", "Shubham", "Siddhant", "Siddharth",
    "Somesh", "Somnath", "Sooraj", "Soumyajit", "Sourav", "Sridhar", "Srinivas", "Subhash",
    "Subir", "Sudarshan", "Sudhanshu", "Sudhir", "Sugandh", "Suhas", "Sujit", "Sukanta",
    "Sukesh", "Sukumar", "Sumeet", "Sumit", "Sundar", "Sunil", "Suraj", "Surendra", "Suresh",
    "Suryakant", "Sushant", "Sushil", "Suyash", "Swapnil", "Swaroop", "Tapan", "Tapas", "Tarun",
    "Tej", "Tejas", "Trilok", "Tushar", "Uday", "Udit", "Ujwal", "Ullas", "Umakant", "Umang",
    "Umesh", "Unmesh", "Upendra", "Utkarsh", "Uttam", "Vachaspati", "Vaibhav", "Valmik", "Varun",
    "Vasant", "Vasu", "Vasudev", "Ved", "Vedant", "Veera", "Venkat", "Venkatesh", "Vibhor",
    "Vidur", "Vidyadhar", "Vihan", "Vijay", "Vikas", "Vikram", "Vikramaditya", "Vimal", "Vinay",
    "Vineet", "Vinod", "Vipin", "Viplav", "Vipul", "Viraj", "Virat", "Vishal", "Vishram",
    "Vishu", "Vishvajeet", "Vishwanath", "Vishwas", "Vivek", "Vyom", "Yash", "Yashpal", "Yashwant",
    "Yatin", "Yogendra", "Yogesh", "Yug", "Yuvraj", "Achyutananda", "Aditeya", "Agam", "Ajinkya",
    "Akshant", "Aravindan", "Archisman", "Balamani", "Bhanumohan", "Chandresh", "Chittesh",
    "Danvir", "Devarsh", "Dhanvin", "Divyeshwar", "Dwijendra", "Ekant", "Garv", "Geetesh",
    "Girindra", "Gopinadhan", "Govidraj", "Harit", "Himaksh", "Indubhushan", "Jayaditya",
    "Jitendrakumar", "Kailasnath", "Kalanidhi", "Kamakshya", "Kandarp", "Kavyansh", "Koustav",
    "Krishanu", "Lakshmidhar", "Lokendra", "Madhavrao", "Maharshi", "Manavendra", "Meghraj",
    "Naveenchandra", "Neelambar", "Nishithkumar", "Padmapati", "Pradyot", "Prathamesh", "Priyesh",
    "Purab", "Raghvendra", "Rajshekhar", "Ramprasad", "Ranganathan", "Rupankar", "Samarjit",
    "Sanatan", "Satyaprakash", "Shankaran", "Shashishekhar", "Shivshankar", "Shrikrishna",
    "Siddheshwar", "Subramaniam", "Sudarshanrao", "Suryanarayan", "Tathagata", "Tejashvi",
    "Tribhuvan", "Udaybhanu", "Upamanyu", "Vaibhavraj", "Vatsalya", "Vidyasagar", "Vijayant",
    "Vireshendra", "Vrishank", "Yadunath", "Yajnavalkya"
]

async def run_deduplication():
    async with AsyncSessionLocal() as session:
        # Fetch all profiles with their associated user
        query = select(Profile).order_by(Profile.created_at.asc())
        profiles = (await session.execute(query)).scalars().all()
        print(f"Total profiles fetched: {len(profiles)}")

        # Fetch users to recognize Ananya, Rohan, Admin, Moderator demo accounts
        users = (await session.execute(select(User))).scalars().all()
        user_by_id = {u.id: u for u in users}

        used_first_names = set()
        
        # Identify demo accounts so they retain "Ananya" and "Rohan"
        ananya_user_id = None
        rohan_user_id = None
        for u in users:
            if u.email == "ananya@bandham.local":
                ananya_user_id = u.id
            elif u.email == "rohan@bandham.local":
                rohan_user_id = u.id

        female_pool = [n for n in FEMALE_NAMES if n != "Ananya"]
        male_pool = [n for n in MALE_NAMES if n != "Rohan"]
        
        female_idx = 0
        male_idx = 0
        
        updated_count = 0

        for p in profiles:
            is_ananya_demo = (p.user_id == ananya_user_id)
            is_rohan_demo = (p.user_id == rohan_user_id)
            
            # Reserved demo profiles
            if is_ananya_demo:
                p.first_name = "Ananya"
                used_first_names.add("Ananya")
                continue
            if is_rohan_demo:
                p.first_name = "Rohan"
                used_first_names.add("Rohan")
                continue

            current_name = (p.first_name or "").strip()
            
            # If name is empty, already seen, or is reserved demo name for non-demo profile:
            if not current_name or current_name in used_first_names or current_name in ["Ananya", "Rohan"]:
                if p.gender == GenderEnum.FEMALE:
                    while female_idx < len(female_pool) and female_pool[female_idx] in used_first_names:
                        female_idx += 1
                    if female_idx < len(female_pool):
                        new_name = female_pool[female_idx]
                        female_idx += 1
                    else:
                        new_name = f"Aditi_{female_idx}"
                else:
                    while male_idx < len(male_pool) and male_pool[male_idx] in used_first_names:
                        male_idx += 1
                    if male_idx < len(male_pool):
                        new_name = male_pool[male_idx]
                        male_idx += 1
                    else:
                        new_name = f"Aarav_{male_idx}"

                p.first_name = new_name
                used_first_names.add(new_name)
                updated_count += 1
            else:
                used_first_names.add(current_name)

        await session.commit()
        print(f"Successfully de-duplicated! Renamed {updated_count} profiles with unique names.")

if __name__ == "__main__":
    asyncio.run(run_deduplication())

import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
    getFirestore, collection, onSnapshot, 
    addDoc, doc, updateDoc 
} from "firebase/firestore";
import { 
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, signOut 
} from "firebase/auth";

// --- PASTE YOUR FIREBASE CONFIG HERE ---
// This configuration should be obtained from your Firebase project console.
// For security reasons, it's best to use environment variables in a real project.
const firebaseConfig = {
  apiKey: "AIzaSy...YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Helper Components ---
const Header = ({ user, onLogout }) => (
  <header className="bg-white shadow-md p-4 flex justify-between items-center">
    <h1 className="text-2xl font-bold text-blue-600">חונך-חכם</h1>
    {user && (
      <div className="flex items-center">
        <span className="text-gray-700 ml-4">שלום, {user.name}</span>
        <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
          התנתק
        </button>
      </div>
    )}
  </header>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);


const TeacherDashboard = ({ user, students, onSelectStudent }) => {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-right">לוח בקרה למורה</h2>
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 text-right">התלמידים שלי</h3>
        {students.length > 0 ? (
            <div className="space-y-3">
            {students.map(student => (
                <div key={student.id} onClick={() => onSelectStudent(student)} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-100 cursor-pointer transition duration-200">
                <span className="text-blue-500 font-semibold">צפה בפרטים &larr;</span>
                <span className="font-medium text-gray-800">{student.name}</span>
                </div>
            ))}
            </div>
        ) : <p className="text-gray-500 text-right">עדיין לא שייכת תלמידים. הוסף תלמיד חדש כדי להתחיל.</p>}
      </div>
    </div>
  );
};

const StudentProfilePage = ({ student, assignments, onBack, onNavigateToCreator }) => {
    return (
        <div className="p-8">
            <button onClick={onBack} className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200">
                &rarr; חזור לרשימת התלמידים
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-right">{student.name}</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 text-right">מטלות</h3>
                <div className="space-y-3">
                    {assignments.length > 0 ? assignments.map(assignment => (
                        <div key={assignment.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div>
                                {assignment.completed ? (
                                    <span className="text-green-600 bg-green-100 py-1 px-3 rounded-full font-semibold">הושלם (ציון: {assignment.score})</span>
                                ) : (
                                    <span className="text-yellow-600 bg-yellow-100 py-1 px-3 rounded-full font-semibold">ממתין לביצוע</span>
                                )}
                            </div>
                            <span className="font-medium text-gray-800">{assignment.title}</span>
                        </div>
                    )) : <p className="text-gray-500 text-right">אין כרגע מטלות לתלמיד זה.</p>}
                </div>
                 <button onClick={() => onNavigateToCreator(student)} className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 text-lg">
                    + הקצה מטלה חדשה
                </button>
            </div>
        </div>
    );
};

const AssignmentCreatorPage = ({ student, questions, onAssign, onCancel }) => {
    const [assignmentName, setAssignmentName] = useState('');
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [filterTopic, setFilterTopic] = useState('all');

    const allTopics = ['all', ...new Set(questions.map(q => q.topic))];

    const filteredBank = questions.filter(q => {
        const isAlreadySelected = selectedQuestions.some(sq => sq.id === q.id);
        if (isAlreadySelected) return false;
        if (filterTopic === 'all') return true;
        return q.topic === filterTopic;
    });

    const addQuestion = (question) => {
        setSelectedQuestions([...selectedQuestions, question]);
    };

    const removeQuestion = (questionId) => {
        setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
    };
    
    const handleAssign = () => {
        if (!assignmentName || selectedQuestions.length === 0) {
            alert("יש לתת שם למטלה ולבחור לפחות שאלה אחת.");
            return;
        }
        onAssign(student.id, assignmentName, selectedQuestions);
    }

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-right">יוצר המטלות עבור {student.name}</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 text-right">שלב 1: פרטי המטלה</h3>
                <input 
                    type="text"
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                    placeholder="שם המטלה (לדוגמה: תרגול שבועי)"
                    className="w-full px-3 py-2 text-right border border-gray-300 rounded-lg"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 text-right">שלב 2: מאגר השאלות</h3>
                    <select onChange={(e) => setFilterTopic(e.target.value)} className="w-full p-2 mb-4 border rounded-lg text-right">
                        {allTopics.map(topic => <option key={topic} value={topic}>{topic === 'all' ? 'כל הנושאים' : topic}</option>)}
                    </select>
                    <div className="space-y-2 h-96 overflow-y-auto pr-2">
                        {filteredBank.map(q => (
                            <div key={q.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                <button onClick={() => addQuestion(q)} className="bg-green-500 text-white font-bold py-1 px-3 rounded-lg text-sm hover:bg-green-600">+ הוסף</button>
                                <div className="text-right">
                                    <p className="font-semibold text-sm">{q.content}</p>
                                    <p className="text-xs text-gray-500">{q.topic}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl shadow-lg">
                     <h3 className="text-xl font-semibold text-gray-700 mb-4 text-right">המטלה הנוכחית ({selectedQuestions.length} שאלות)</h3>
                     <div className="space-y-2 h-96 overflow-y-auto pr-2">
                        {selectedQuestions.length > 0 ? selectedQuestions.map(q => (
                             <div key={q.id} className="p-3 bg-white rounded-lg flex justify-between items-center">
                                <button onClick={() => removeQuestion(q.id)} className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg text-sm hover:bg-red-600">x הסר</button>
                                <div className="text-right">
                                    <p className="font-semibold text-sm">{q.content}</p>
                                    <p className="text-xs text-gray-500">{q.topic}</p>
                                </div>
                            </div>
                        )) : <p className="text-center text-gray-500 mt-10">הוסף שאלות מהמאגר...</p>}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
                 <button onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200">
                    בטל
                </button>
                <button onClick={handleAssign} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 text-lg">
                    הקצה מטלה לתלמיד
                </button>
            </div>
        </div>
    );
};


const StudentDashboard = ({ user, assignments, onStartAssignment }) => {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-right">לוח בקרה לתלמיד</h2>
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 text-right">מטלות לביצוע</h3>
        <div className="space-y-3">
          {assignments.filter(a => !a.completed).length > 0 ? assignments.filter(a => !a.completed).map(assignment => (
            <div key={assignment.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <button onClick={() => onStartAssignment(assignment)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200">
                התחל
              </button>
              <span className="font-medium text-gray-800">{assignment.title}</span>
            </div>
          )) : <p className="text-gray-500 text-right">אין לך מטלות חדשות. כל הכבוד!</p>}
        </div>
      </div>
       <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 text-right">מטלות שהושלמו</h3>
        <div className="space-y-3">
          {assignments.filter(a => a.completed).map(assignment => (
            <div key={assignment.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-green-600 font-semibold">ציון: {assignment.score}</span>
              <span className="font-medium text-gray-800">{assignment.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PracticeSessionPage = ({ assignment, onComplete, questions }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    
    if (!questions || questions.length === 0) {
        return <div className="p-8 text-center">טוען שאלות...</div>;
    }
    const currentQuestion = questions[currentQuestionIndex];

    const handleAnswer = (option) => {
        const newAnswers = {...answers, [currentQuestion.id]: option };
        setAnswers(newAnswers);
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                calculateScoreAndComplete(newAnswers);
            }
        }, 500);
    };

    const calculateScoreAndComplete = (finalAnswers) => {
        let correctAnswers = 0;
        questions.forEach(q => {
            if (finalAnswers[q.id] === q.answer) {
                correctAnswers++;
            }
        });
        const score = Math.round((correctAnswers / questions.length) * 100);
        onComplete(assignment.id, score);
    };

    return (
        <div className="p-8 flex flex-col items-center">
            <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg">
                <p className="text-sm text-gray-500 text-right">שאלה {currentQuestionIndex + 1} מתוך {questions.length}</p>
                <h2 className="text-2xl font-bold text-gray-800 my-4 text-right">{currentQuestion.content}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map(option => (
                        <button 
                            key={option} 
                            onClick={() => handleAnswer(option)}
                            className={`p-4 text-lg text-center rounded-lg transition duration-200 ${answers[currentQuestion.id] === option ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-blue-200'}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                 <div className="w-full bg-gray-200 rounded-full h-2.5 mt-8">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
            </div>
        </div>
    );
};

const ResultsPage = ({ score, onBackToDashboard }) => (
    <div className="p-8 flex flex-col items-center text-center">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">כל הכבוד!</h2>
            <p className="text-lg text-gray-600 mb-6">סיימת את המטלה.</p>
            <div className="bg-blue-100 border-4 border-blue-500 rounded-full w-48 h-48 flex items-center justify-center mx-auto mb-6">
                <div className="text-center">
                    <p className="text-gray-600">הציון שלך</p>
                    <p className="text-5xl font-bold text-blue-600">{score}</p>
                </div>
            </div>
            <button onClick={onBackToDashboard} className="w-full py-3 px-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-200">
                חזור ללוח הבקרה
            </button>
        </div>
    </div>
);


export default function App() {
  const [currentUser, setCurrentUser] = useState(null); // Will be set by Auth
  const [page, setPage] = useState('loading'); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [lastScore, setLastScore] = useState(0);
  
  // States to hold real-time data from Firebase
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- REAL-TIME FIREBASE LISTENERS ---
  useEffect(() => {
    // Listener for Authentication state
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
        if (user) {
            // User is signed in, fetch their profile from 'users' collection
            const userRef = doc(db, "users", user.uid);
            const unsubscribeUser = onSnapshot(userRef, (doc) => {
                setCurrentUser({ id: doc.id, ...doc.data() });
                setPage(doc.data().role === 'teacher' ? 'teacherDashboard' : 'studentDashboard');
                setIsLoading(false);
            });
            return () => unsubscribeUser();
        } else {
            // User is signed out
            setCurrentUser(null);
            // setPage('login'); // TODO: Re-enable login page later
            
            // For now, let's auto-login as a mock user if no one is logged in
            // THIS SHOULD BE REMOVED BEFORE LAUNCH
            const tempTeacherId = "mock-teacher-id"; // In a real scenario, you'd have a login page
            setCurrentUser({ id: tempTeacherId, name: 'אבי כהן (זמני)', role: 'teacher' });
            setPage('teacherDashboard');
            setIsLoading(false);
        }
    });

    // Listener for Questions collection
    const questionsCollection = collection(db, "questions");
    const unsubscribeQuestions = onSnapshot(questionsCollection, (snapshot) => {
        setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listener for Users collection (to get list of students for a teacher)
    const usersCollection = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersCollection, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // Listener for Assignments collection
    const assignmentsCollection = collection(db, "assignments");
    const unsubscribeAssignments = onSnapshot(assignmentsCollection, (snapshot) => {
        setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
        unsubscribeAuth();
        unsubscribeQuestions();
        unsubscribeUsers();
        unsubscribeAssignments();
    };
  }, []);

  const navigate = (pageName) => setPage(pageName);

  // --- FIREBASE ACTIONS ---
  const handleAssign = async (studentId, title, selectedQs) => {
    try {
        await addDoc(collection(db, "assignments"), {
            studentId,
            teacherId: currentUser.id,
            title,
            questionIds: selectedQs.map(q => q.id),
            completed: false,
            score: null,
            createdAt: new Date(),
        });
        navigate('studentProfile');
    } catch (e) {
        console.error("Error adding assignment: ", e);
        alert("שגיאה בהקצאת המטלה.");
    }
  }

  const handleCompleteAssignment = async (assignmentId, score) => {
      try {
        const assignmentRef = doc(db, "assignments", assignmentId);
        await updateDoc(assignmentRef, {
            completed: true,
            score: score,
        });
        setLastScore(score);
        navigate('results');
      } catch (e) {
        console.error("Error updating assignment: ", e);
        alert("שגיאה בעדכון המטלה.");
      }
  }

  const handleSelectStudent = (student) => {
      setSelectedStudent(student);
      navigate('studentProfile');
  }
  
  const handleNavigateToCreator = (student) => {
      setSelectedStudent(student);
      navigate('assignmentCreator');
  }

  const handleStartAssignment = (assignment) => {
      setSelectedAssignment(assignment);
      navigate('practice');
  }

  const handleLogout = () => {
      signOut(auth);
  }

  const renderPage = () => {
    if (isLoading) return <LoadingSpinner />;
    if (!currentUser) return <div className="p-8 text-center">אנא התחבר... (מסך התחברות יופיע כאן)</div>;

    const teacherStudents = users.filter(u => u.role === 'student' && u.teacherId === currentUser?.id);
    const studentAssignments = assignments.filter(a => a.studentId === currentUser?.id);

    switch (page) {
      case 'teacherDashboard':
        return <TeacherDashboard user={currentUser} students={teacherStudents} onSelectStudent={handleSelectStudent} />;
      case 'studentProfile':
        return <StudentProfilePage 
                    student={selectedStudent} 
                    assignments={assignments.filter(a => a.studentId === selectedStudent.id)} 
                    onBack={() => navigate('teacherDashboard')} 
                    onNavigateToCreator={handleNavigateToCreator}
                />;
      case 'assignmentCreator':
        return <AssignmentCreatorPage 
                    student={selectedStudent} 
                    questions={questions}
                    onAssign={handleAssign} 
                    onCancel={() => navigate('studentProfile')} 
                />;
      case 'studentDashboard':
        return <StudentDashboard user={currentUser} assignments={studentAssignments} onStartAssignment={handleStartAssignment} />;
      case 'practice':
        const practiceQuestions = questions.filter(q => selectedAssignment.questionIds.includes(q.id));
        return <PracticeSessionPage assignment={selectedAssignment} questions={practiceQuestions} onComplete={handleCompleteAssignment} />;
      case 'results':
        return <ResultsPage score={lastScore} onBackToDashboard={() => navigate(currentUser.role === 'teacher' ? 'teacherDashboard' : 'studentDashboard')} />;
      default:
        return <LoadingSpinner />;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans" dir="rtl">
      <Header user={currentUser} onLogout={handleLogout} />
      <main>
        {renderPage()}
      </main>
    </div>
  );
}

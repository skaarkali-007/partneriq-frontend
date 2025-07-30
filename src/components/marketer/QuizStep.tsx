import React, { useState } from 'react';

interface QuizStepProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'compliance1',
    question: 'What is the most important consideration when marketing financial products?',
    options: [
      'Maximizing commission earnings',
      'Ensuring compliance with regulations and truthful advertising',
      'Getting as many clicks as possible',
      'Using aggressive sales tactics'
    ],
    correctAnswer: 1,
    explanation: 'Compliance with regulations and truthful advertising is paramount when marketing financial products to protect consumers and maintain trust.'
  },
  {
    id: 'disclosure1',
    question: 'When must affiliate relationships be disclosed to potential customers?',
    options: [
      'Only if the customer asks',
      'At the end of the sales process',
      'Clearly and prominently before any marketing message',
      'Never, it\'s not required'
    ],
    correctAnswer: 2,
    explanation: 'Affiliate relationships must be disclosed clearly and prominently before any marketing message to ensure transparency with potential customers.'
  },
  {
    id: 'targeting1',
    question: 'Which marketing practice is NOT appropriate for financial products?',
    options: [
      'Targeting based on financial need and suitability',
      'Providing clear and accurate product information',
      'Making unrealistic promises about guaranteed returns',
      'Offering educational content about financial planning'
    ],
    correctAnswer: 2,
    explanation: 'Making unrealistic promises about guaranteed returns is inappropriate and potentially illegal when marketing financial products.'
  },
  {
    id: 'data1',
    question: 'How should customer personal information be handled?',
    options: [
      'Shared freely with other marketers',
      'Used only for the intended purpose and protected according to privacy laws',
      'Sold to third parties for additional revenue',
      'Stored without any security measures'
    ],
    correctAnswer: 1,
    explanation: 'Customer personal information must be used only for its intended purpose and protected according to privacy laws like GDPR and CCPA.'
  },
  {
    id: 'claims1',
    question: 'What type of claims can be made about investment products?',
    options: [
      'Any claims that sound appealing',
      'Only claims that are substantiated and include appropriate risk disclosures',
      'Claims about guaranteed profits',
      'Exaggerated performance claims'
    ],
    correctAnswer: 1,
    explanation: 'Only substantiated claims with appropriate risk disclosures can be made about investment products to ensure consumer protection.'
  },
  {
    id: 'prohibited1',
    question: 'Which of the following is prohibited in financial marketing?',
    options: [
      'Explaining product features clearly',
      'Providing risk warnings',
      'Using high-pressure sales tactics or creating false urgency',
      'Offering educational resources'
    ],
    correctAnswer: 2,
    explanation: 'High-pressure sales tactics and creating false urgency are prohibited in financial marketing as they can lead to unsuitable financial decisions.'
  },
  {
    id: 'suitability1',
    question: 'What is the concept of "suitability" in financial services?',
    options: [
      'Products should be expensive',
      'Products should match the customer\'s financial situation, needs, and risk tolerance',
      'Products should have high commissions',
      'Products should be complex'
    ],
    correctAnswer: 1,
    explanation: 'Suitability means ensuring financial products match the customer\'s financial situation, needs, and risk tolerance.'
  },
  {
    id: 'record1',
    question: 'How long should marketing communications and customer interactions be retained?',
    options: [
      'They don\'t need to be retained',
      'For 30 days only',
      'According to regulatory requirements (typically 3-7 years)',
      'Forever'
    ],
    correctAnswer: 2,
    explanation: 'Marketing communications and customer interactions should be retained according to regulatory requirements, typically 3-7 years depending on jurisdiction.'
  }
];

export const QuizStep: React.FC<QuizStepProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const question = quizQuestions[currentQuestion];
    const newAnswers = { ...answers, [question.id]: selectedAnswer };
    setAnswers(newAnswers);

    if (!showExplanation) {
      setShowExplanation(true);
      return;
    }

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz completed
      const finalScore = Object.keys(newAnswers).reduce((total, questionId) => {
        const question = quizQuestions.find(q => q.id === questionId);
        return total + (question && newAnswers[questionId] === question.correctAnswer ? 1 : 0);
      }, 0);
      
      setScore(finalScore);
      setQuizCompleted(true);
    }
  };

  const handleSubmitQuiz = async () => {
    const passingScore = Math.ceil(quizQuestions.length * 0.8); // 80% passing rate
    const passed = score >= passingScore;

    if (!passed) {
      alert(`You need at least ${passingScore} correct answers to pass. You scored ${score}/${quizQuestions.length}. Please retake the quiz.`);
      // Reset quiz
      setCurrentQuestion(0);
      setAnswers({});
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuizCompleted(false);
      setScore(0);
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/marketer/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          score,
          passed,
          totalQuestions: quizQuestions.length
        })
      });

      const result = await response.json();
      
      if (result.success) {
        onComplete(result.data);
      } else {
        alert('Failed to submit quiz results. Please try again.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (quizCompleted) {
    const passingScore = Math.ceil(quizQuestions.length * 0.8);
    const passed = score >= passingScore;

    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Results</h2>
          <p className="text-gray-600">
            You have completed the compliance and marketing quiz.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="text-center">
            <div className={`text-6xl mb-4 ${passed ? 'text-green-500' : 'text-red-500'}`}>
              {passed ? '✅' : '❌'}
            </div>
            
            <h3 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-900' : 'text-red-900'}`}>
              {passed ? 'Congratulations!' : 'Quiz Not Passed'}
            </h3>
            
            <p className="text-lg text-gray-700 mb-4">
              You scored {score} out of {quizQuestions.length} questions correctly
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Score</span>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round((score / quizQuestions.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passed ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(score / quizQuestions.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Passing score: {Math.round((passingScore / quizQuestions.length) * 100)}%
              </p>
            </div>

            {passed ? (
              <div>
                <p className="text-gray-600 mb-6">
                  You have successfully demonstrated your understanding of compliance and marketing 
                  requirements for financial products. You can now proceed to complete your registration.
                </p>
                
                <button
                  onClick={handleSubmitQuiz}
                  disabled={loading}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-6">
                  You need to score at least {passingScore} out of {quizQuestions.length} questions correctly to pass. 
                  Please review the material and retake the quiz.
                </p>
                
                <button
                  onClick={() => {
                    setCurrentQuestion(0);
                    setAnswers({});
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setQuizCompleted(false);
                    setScore(0);
                  }}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <div></div>
        </div>
      </div>
    );
  }

  const question = quizQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Compliance Quiz</h2>
        <p className="text-gray-600">
          Question {currentQuestion + 1} of {quizQuestions.length}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {currentQuestion + 1} of {quizQuestions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          {question.question}
        </h3>

        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAnswer === index
                  ? showExplanation
                    ? index === question.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="quiz-answer"
                value={index}
                checked={selectedAnswer === index}
                onChange={() => handleAnswerSelect(index)}
                disabled={showExplanation}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-900">{option}</span>
              {showExplanation && index === question.correctAnswer && (
                <span className="ml-auto text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {showExplanation && selectedAnswer === index && index !== question.correctAnswer && (
                <span className="ml-auto text-red-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
            </label>
          ))}
        </div>

        {showExplanation && (
          <div className={`p-4 rounded-lg mb-6 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? (
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h4 className={`text-sm font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </h4>
                <p className={`text-sm mt-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        
        <button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {showExplanation 
            ? (currentQuestion === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question')
            : 'Submit Answer'
          }
        </button>
      </div>
    </div>
  );
};
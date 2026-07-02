import React from 'react'

const questionsApiUrl = "https://opentdb.com/api.php?amount=5&category=18&difficulty=easy&type=multiple"
let inFlightQuestionsRequest = null

function shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

function decodeHtmlEntities(text) {
    const parser = new DOMParser()
    const parsed = parser.parseFromString(`<!doctype html><body>${text}`, 'text/html')
    return parsed.body.textContent || ''
}

async function fetchQuizQuestions() {
    if (!inFlightQuestionsRequest) {
        inFlightQuestionsRequest = fetch(questionsApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`)
                }

                return response.json()
            })
            .then(payload => {
                if (!Array.isArray(payload.results)) {
                    throw new Error('Invalid quiz response')
                }

                return payload.results.map(question => ({
                    ...question,
                    question: decodeHtmlEntities(question.question),
                    correct_answer: decodeHtmlEntities(question.correct_answer),
                    incorrect_answers: question.incorrect_answers.map(answer => decodeHtmlEntities(answer)),
                }))
            })
            .finally(() => {
                inFlightQuestionsRequest = null
            })
    }

    return inFlightQuestionsRequest
}

function buildShuffledAnswers(questions) {
    const answers = {}

    questions.forEach((question, idx) => {
        answers[idx] = shuffleArray([
            ...question.incorrect_answers,
            question.correct_answer,
        ])
    })

    return answers
}

export default function Main() {
    const [data, setData] = React.useState([])
    const [shuffledAnswers, setShuffledAnswers] = React.useState({})
    const [isChecked, setIsChecked] = React.useState({})
    const [showResults, setShowResults] = React.useState(false)
    const [score, setScore] = React.useState(0)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)

    React.useEffect(() => {
        let isActive = true

        async function loadQuestions() {
            try {
                const questions = await fetchQuizQuestions()

                if (!isActive) {
                    return
                }

                setData(questions)
                setShuffledAnswers(buildShuffledAnswers(questions))
            } catch (error) {
                if (!isActive) {
                    return
                }

                setError("Failed to load questions. Please try again.")
                console.log(error)
            } finally {
                if (isActive) {
                    setLoading(false)
                }
            }
        }

        loadQuestions()

        return () => {
            isActive = false
        }
    }, [])

    function handleChecked() {
        if (!showResults) {
            // Check if all questions are answered
            if (Object.keys(isChecked).length !== data.length) {
                alert(`Please answer all ${data.length} questions before submitting!`)
                return
            }
            
            let finalScore = 0

            data.forEach((question, questionIdx) => {
                const allAnswers = shuffledAnswers[questionIdx]
                const selectedAnswer = allAnswers[isChecked[questionIdx]]

                if (selectedAnswer === question.correct_answer) {
                    finalScore++
                }
            })

            setScore(finalScore)
            setShowResults(true)
        } else {
            // Play Again
            setIsChecked({})
            setScore(0)
            setShowResults(false)
            setLoading(true)
            setError(null)

            fetchQuizQuestions()
                .then(questions => {
                    setData(questions)
                    setShuffledAnswers(buildShuffledAnswers(questions))
                })
                .catch(error => {
                    setError("Failed to load questions. Please try again.")
                    console.log(error)
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }
    const selectAnswer = (questionIdx, answerIdx) => {
        if (showResults) return
        setIsChecked(prev => ({
            ...prev,
            [questionIdx]: answerIdx,
        }))
    }

    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px', color: '#293264' }}>Loading questions...</div>
    }

    if (error) {
        return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '16px', color: '#d9534f', padding: '20px' }}>
            {error}
            <br />
            <button onClick={() => window.location.reload()} style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#4D5B9E', color: '#F5F7FB', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Retry
            </button>
        </div>
    }

    if (data.length === 0) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>No questions available</div>
    }
    return (
        <main>
            {data.map((question, index) => {
                const allAnswers = shuffledAnswers[index] || []

                return (
                    <div key={index}>
                        <h2 className='question'>{question.question}</h2>
                        <div className='options'>
                            {allAnswers.map((answer, idx) => {
                                const isSelected = isChecked[index] === idx

                                let className = 'option'

                                if (!showResults) {
                                    if (isSelected) className = 'checked'
                                } else {
                                    if (answer === question.correct_answer) {
                                        className = 'correct'

                                    } else if (isSelected) {
                                        className = 'incorrect'
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => selectAnswer(index, idx)}
                                        className={className}
                                        disabled={showResults}
                                    >
                                        {answer}
                                    </button>
                                )
                            })}
                        </div>
                        <hr />
                    </div>
                )
            })}

            <div className="results">
                {showResults && <span>You scored {score}/5 answers</span>}

                <button
                    className="check"
                    onClick={handleChecked}
                >
                    {showResults ? "Play again" : "Check answers"}
                </button>
            </div>
        </main>
    )
}
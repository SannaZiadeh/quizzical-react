import React from 'react'
import Main from './Components/Main'
import Intro from './Components/Intro'

export default function App() {
    const [isStart, setIsStart] = React.useState(true)

    function handleStart() {
        setIsStart(false)
    }

    return (
        <div className="app-shell">
            <div className='seq'></div>
            {isStart ? <Intro handleStart={handleStart} /> : <Main />}
            <div className='seq2'></div>
        </div>
    )
}
export  default function Intro(props){

    return(
        <div className="intro"> 
        <h1>Quizzical</h1>
         <p>Some description if needed</p>
            <button
            onClick={props.handleStart}
            >Start quiz</button> 
        </div>
    )
}
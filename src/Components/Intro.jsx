export  default function Intro(props){

    return(
        <section className="intro intro-screen"> 
        <h1>Quizzical</h1>
         <p>Some description if needed</p>
            <button
            onClick={props.handleStart}
            >Start quiz</button> 
        </section>
    )
}
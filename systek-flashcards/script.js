
let employees = [
];
let currentEmployeeIndex = 0;
let score = 0;

const jsConfetti = new JSConfetti()

const employeeImage = document.getElementById('employee-image');
const guessInput = document.getElementById('guess-input');
const submitBtn = document.getElementById('submit-btn');
const scoreDisplay = document.getElementById('score');
const feedback = document.getElementById('feedback');
const namesDatalist = document.getElementById('names');

let correctSound = new Audio('audio/correct.mp3');
let wrongSound = new Audio('audio/wrong.mp3');

function populateDatalist() {
    let options = shuffleArray(employees);
    options.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.name;
        namesDatalist.appendChild(option);
    });
}

function fetchData() {
    let siteUrl = "https://aleksag.github.io/systek-flashcards/backup.html";
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1"){
        siteUrl = "http://localhost:8000/backup.html"
    }
    fetch(siteUrl)
        .then((response) => response.text()).then((data) => takeData(data));
}

function takeData(val) {
    var doc = (new DOMParser).parseFromString(val, "text/html");
    let ansatte = doc.querySelectorAll('[class^="employeeCard_employee"]')
    ansatte.forEach(ansatt => {
        let ePhoto = ansatt.getElementsByTagName("img")[0].src;
        let eName = ansatt.querySelectorAll('[class^="employeeCard_name"]')[0].innerHTML;
        employees.push(
            {
                name: eName.trim(),
                photo:ePhoto
            }
        );

    });
    employees = removeRobot(employees);
    employees = shuffleArray(employees);
    populateDatalist();
    loadEmployee();
    updateScore();
}

function removeRobot(employeeObjects) {    
    const seenImages = new Set();  
    let robotUrl = "";
    employeeObjects.forEach(employee => {
        if (seenImages.has(employee.photo)) {
            robotUrl = employee.photo;
        }else{
            seenImages.add(employee.photo);
        }
    });

    let filteredEmployees = Array();
    employeeObjects.forEach(employee => {
        if(employee.photo != robotUrl){
            filteredEmployees.push(employee);
        }
    })
    return filteredEmployees;
}

function updateScore(){
    scoreDisplay.textContent = `Score: ${score}/${employees.length}`;
}
function shuffleArray(array) {
    let shuffledArray = array.slice();

    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];  
    }

    return shuffledArray;
}

function loadEmployee() {
    const currentEmployee = employees[currentEmployeeIndex];
    employeeImage.src = currentEmployee.photo;
    guessInput.value = '';  
}
function correct(){
    feedback.textContent = 'Riktig!';
    feedback.style.color = 'green';
    correctSound.play();
    jsConfetti.addConfetti({
        emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸'],
     })
    score++;        
}

function wrong(){
    wrongSound.play();
    feedback.textContent = `Feil! Riktig navn var ${employees[currentEmployeeIndex].name}`;
    feedback.style.color = 'red';
    jsConfetti.addConfetti({
        emojis: ['💩'],
     })
}

function checkAnswer() {
    const currentEmployee = employees[currentEmployeeIndex];
    const userGuess = guessInput.value.trim();

    if (userGuess.toLowerCase() === currentEmployee.name.toLowerCase()) {
        correct();
    } else {
        wrong();
    }

    updateScore();

    currentEmployeeIndex++;
    if (currentEmployeeIndex < employees.length) {
        loadEmployee();
    } else {
        feedback.textContent = ' Game over!, du fikk '+score+" riktige av "+employees.length+" mulige";
        submitBtn.disabled = true;  // Disable the submit button when the game ends
    }
}

guessInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        checkAnswer();
    }
});

submitBtn.addEventListener('click', checkAnswer);

fetchData();


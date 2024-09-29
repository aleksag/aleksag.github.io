
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
const incorrectGuessList = document.getElementById('incorrect-guess-list')
const resetBtn = document.getElementById('reset-btn');
const hoverEmployeeImage = document.getElementById('hover-employee-image');
const hoverEmployeeImageContainer = document.getElementById('hover-image-container');
const employeeCountSelect = document.getElementById('employee-count');


let correctSound = new Audio('audio/correct.mp3');
let wrongSound = new Audio('audio/wrong.mp3');
let answers = {};
let employeeSubset = [];

function populateDatalist() {
    let options = shuffleArray(employees);
    namesDatalist.innerHTML = "";
    options.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.name;
        namesDatalist.appendChild(option);
    });
}
function loadStatistics(){
    if (localStorage.getItem("statistics") === null) {
        answers = {};
        saveStatistics();
    }
    answers = JSON.parse(localStorage.getItem('statistics'))
    updateStatistics();
}
function saveStatistics(){
    localStorage.setItem('statistics', JSON.stringify(answers));
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
    
    setEmployeeSubset()
    loadStatistics();
    updateStatistics();
}

function setEmployeeSubset() {
    employees = shuffleArray(employees);
    
    const selectedCount = employeeCountSelect.value;
    console.log(employees.length);
    if (selectedCount === "all") {
        employeeSubset = [...employees];  // Use all employees
    } else {
        const count = parseInt(selectedCount);
        console.log("selectedCount:"+selectedCount);
        employeeSubset = employees.slice(0, count);  // Slice the array for the selected count
    }

    // Reset the game
    currentEmployeeIndex = 0;
    score = 0;
    submitBtn.disabled = false;  // Enable the submit button
    incorrectGuessList.innerHTML = '';  // Clear incorrect guesses
    populateDatalist();  // Populate the datalist with the selected employees
    loadEmployee();  // Load the first employee
    updateScore();
    loadStatistics();
    updateStatistics();
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
    console.log(employeeSubset.length);
    scoreDisplay.textContent = `Score: ${score}/${employeeSubset.length}`;
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
    const currentEmployee = employeeSubset[currentEmployeeIndex];
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
    let employeeName = employeeSubset[currentEmployeeIndex].name;
    feedback.textContent = `Feil! Riktig navn var ${employeeName} `;
    if(employeeName in answers){
        answers[employeeName] = answers[employeeName] + 1;
    }else{
        answers[employeeName] = 1;
    }
    updateStatistics();
    saveStatistics();
    feedback.style.color = 'red';
    jsConfetti.addConfetti({
        emojis: ['💩'],
     })
}

function updateStatistics(){
    incorrectGuessList.innerHTML = "";
    for(let employeeName in answers){

        var employeeObject = employees.filter( item => item.name === employeeName)[0];

        const li = document.createElement('li');
        li.textContent = `${employeeName} - antall ganger feil: ${answers[employeeName]}`
        li.dataset.photo = employeeObject.photo;
        li.addEventListener('mouseenter', function() {
            hoverEmployeeImage.src = li.dataset.photo;
            hoverEmployeeImage.style.display = 'block';  // Show image on hover
            hoverEmployeeImageContainer.style.display = 'block'
        });
    
        li.addEventListener('mouseleave', function() {
            hoverEmployeeImage.style.display = 'none';  // Hide image when not hovering
            hoverEmployeeImageContainer.style.display = 'none';
        });


        incorrectGuessList.appendChild(li);
    }
}
function resetStatistics(){
    answers = {};
    saveStatistics();
    updateStatistics();
}

function checkAnswer() {
    const currentEmployee = employeeSubset[currentEmployeeIndex];
    const userGuess = guessInput.value.trim();

    if (userGuess.toLowerCase() === currentEmployee.name.toLowerCase()) {
        correct();
    } else {
        wrong();
    }

    updateScore();

    currentEmployeeIndex++;
    if (currentEmployeeIndex < employeeSubset.length) {
        loadEmployee();
    } else {
        feedback.textContent = ' Game over!, du fikk '+score+" riktige av "+employeeSubset.length+" mulige";
        submitBtn.disabled = true;  // Disable the submit button when the game ends
    }
}

guessInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        checkAnswer();
    }
});

submitBtn.addEventListener('click', checkAnswer);
resetBtn.addEventListener('click', resetStatistics);
employeeCountSelect.addEventListener('change', setEmployeeSubset);
fetchData();



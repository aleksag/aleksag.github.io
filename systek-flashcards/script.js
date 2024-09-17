let employees = [
];
let currentEmployeeIndex = 0;
let score = 0;

const employeeImage = document.getElementById('employee-image');
const guessInput = document.getElementById('guess-input');
const submitBtn = document.getElementById('submit-btn');
const scoreDisplay = document.getElementById('score');
const feedback = document.getElementById('feedback');
const namesDatalist = document.getElementById('names');

function populateDatalist() {
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.name;
        namesDatalist.appendChild(option);
    });
}

function fetchData() {
    let siteUrl = "https://systek.no/folka-vare";
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
                name: eName,
                photo:ePhoto
            }
        );

    });
    employees = shuffleArray(employees);
    populateDatalist();
    loadEmployee();
    updateScore();
}

function updateScore(){
    scoreDisplay.textContent = `Score: ${score}/${employees.length}`;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];  
    }
    return array;
}

function loadEmployee() {
    const currentEmployee = employees[currentEmployeeIndex];
    employeeImage.src = currentEmployee.photo;
    guessInput.value = '';  
}


function checkAnswer() {
    const currentEmployee = employees[currentEmployeeIndex];
    const userGuess = guessInput.value.trim();

    if (userGuess.toLowerCase() === currentEmployee.name.toLowerCase()) {
        feedback.textContent = 'Riktig!';
        feedback.style.color = 'green';
        score++;        
    } else {
        feedback.textContent = `Feil! Riktig navn var ${currentEmployee.name}`;
        feedback.style.color = 'red';
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


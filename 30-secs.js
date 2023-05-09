fetch("30-secs-words.json")
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => alert(`Error: ${error}`));

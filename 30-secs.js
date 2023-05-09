fetch("https://gist.githubusercontent.com/atduskgreg/3cf8ef48cb0d29cf151bedad81553a54/raw/82f142562cf50b0f6fb8010f890b2f934093553e/animals.txt")
    .then(response => console.log(response))
    .catch(error => alert(`Error: ${error}`));

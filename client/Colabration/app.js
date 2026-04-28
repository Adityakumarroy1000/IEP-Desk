let url = "https://script.google.com/macros/s/AKfycbwU48-4nzChpPGNiSETkJ-kZXXdSOIdfYLi7DiQ3MEUI3YrHGjxkS2IVBQv8Yk_NrIy/exec";

let form = document.querySelector(".form")
form.addEventListener("submit",(e)=>{
    let d = new FormData(form);
    fetch(url,{
        method:"POST",
        body:d
    }).then((res)=>res.text())
    .then((finalRes)=>console.log(finalRes))
    e.preventDefault();
})





document.getElementById('productForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent actual form submission

    // Validate required fields manually (optional - form already does this)
    const form = e.target;
    if (!form.checkValidity()) {
      return;
    }

    // Show success message
    const successMessage = document.createElement('div');
    successMessage.textContent = '✅ Product submitted successfully!';
    successMessage.className = 'bg-green-100 text-green-800 p-4 rounded mt-4 text-center';
    
    // Insert message below the form
    form.parentElement.appendChild(successMessage);

    // Optionally reset the form
    form.reset();

    // Remove the message after 4 seconds
    setTimeout(() => {
      successMessage.remove();
    }, 8000);
  });
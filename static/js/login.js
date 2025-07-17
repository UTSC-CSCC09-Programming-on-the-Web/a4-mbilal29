(function () {
  "use strict";

  function showLoading() {
    document.querySelector("#loadingOverlay").classList.add("show");
  }

  function hideLoading() {
    document.querySelector("#loadingOverlay").classList.remove("show");
  }

  function showError(message) {
    const errorBox = document.querySelector("#error-box");
    errorBox.textContent = message;
    errorBox.style.visibility = "visible";
    errorBox.classList.remove("success");
    errorBox.classList.add("error");
  }

  function showSuccess(message) {
    const errorBox = document.querySelector("#error-box");
    errorBox.textContent = message;
    errorBox.style.visibility = "visible";
    errorBox.classList.remove("error");
    errorBox.classList.add("success");
  }

  function hideError() {
    document.querySelector("#error-box").style.visibility = "hidden";
  }

  window.onload = function () {
    function handleSignup() {
      hideError();

      const username = document.querySelector("#username").value.trim();
      const password = document.querySelector("#password").value.trim();

      if (!username || !password) {
        return showError("Username and password are required");
      }

      showLoading();

      apiService
        .signup(username, password)
        .then((response) => {
          hideLoading();

          if (response.error) {
            return showError(response.error);
          }

          showSuccess("Account created successfully! Please sign in.");
          document.querySelector("form").reset();
          document.querySelector("[name=action]").value = "signin"; // Switch to signin mode
        })
        .catch((err) => {
          hideLoading();
          showError("Signup failed. Please try again.");
          console.error("Signup error:", err);
        });
    }

    function handleSignin() {
      hideError();

      const username = document.querySelector("#username").value.trim();
      const password = document.querySelector("#password").value.trim();

      if (!username || !password) {
        return showError("Username and password are required");
      }

      showLoading();

      apiService
        .signin(username, password)
        .then((response) => {
          hideLoading();

          if (response.error) {
            return showError(response.error);
          }

          window.location.href = "/";
        })
        .catch((err) => {
          hideLoading();
          showError("Authentication failed. Please try again.");
          console.error("Auth error:", err);
        });
    }

    document.querySelector("#signin").addEventListener("click", function () {
      handleSignin();
    });

    document.querySelector("#signup").addEventListener("click", function () {
      handleSignup();
    });

    document.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      const action = document.querySelector("[name=action]").value;
      if (action === "signin") {
        handleSignin();
      } else {
        handleSignup();
      }
    });
  };
})();

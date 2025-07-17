(function () {
  "use strict";

  function showLoading() {
    document.querySelector("#loadingOverlay").classList.add("show");
  }

  function hideLoading() {
    document.querySelector("#loadingOverlay").classList.remove("show");
  }

  window.onload = function () {
    const [currentIndexKey, getCurrentIndex, setCurrentIndex] =
      meact.useState(0);
    const [commentPageKey, getCommentPage, setCommentPage] = meact.useState(0);
    const [currentUserKey, getCurrentUser, setCurrentUser] =
      meact.useState(null);
    const [selectedUserKey, getSelectedUser, setSelectedUser] =
      meact.useState("all");
    let currentVisibleComment = null;

    showLoading();
    apiService
      .getCurrentUser()
      .then((userData) => {
        if (!userData.error) {
          setCurrentUser(userData);

          updateUIForLoggedInUser(userData.username);

          const userGallerySelector = document.querySelector("#userGallery");
          const userOptions = Array.from(userGallerySelector.options);
          const userOption = userOptions.find(
            (option) => option.value === userData.id.toString(),
          );

          if (userOption) {
            userGallerySelector.value = userData.id;
            setSelectedUser(userData.id);
            updateAddImageVisibility(userData.id);
          }
        } else {
          updateUIForLoggedOutUser();
        }

        loadUserList();
      })
      .catch((err) => {
        updateUIForLoggedOutUser();
        loadUserList();
      })
      .finally(hideLoading);

    function loadUserList() {
      apiService
        .getAllUsers()
        .then((users) => {
          const gallerySelector = document.querySelector("#userGallery");

          while (gallerySelector.firstChild) {
            gallerySelector.removeChild(gallerySelector.firstChild);
          }

          users.forEach((user) => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = `${user.username}'s Gallery`;
            gallerySelector.appendChild(option);
          });

          const currentUser = getCurrentUser();
          let selectedUserId;

          if (currentUser) {
            const userOption = Array.from(gallerySelector.options).find(
              (option) => option.value === currentUser.id.toString(),
            );

            if (userOption) {
              gallerySelector.value = currentUser.id;
              selectedUserId = currentUser.id;
              setSelectedUser(currentUser.id);
            } else if (gallerySelector.options.length > 0) {
              gallerySelector.selectedIndex = 0;
              selectedUserId = gallerySelector.value;
              setSelectedUser(gallerySelector.value);
            }
          } else if (gallerySelector.options.length > 0) {
            gallerySelector.selectedIndex = 0;
            selectedUserId = gallerySelector.value;
            setSelectedUser(gallerySelector.value);
          }

          updateAddImageVisibility(selectedUserId);
        })
        .catch((err) => {});
    }

    document
      .querySelector("#userGallery")
      .addEventListener("change", function () {
        const selectedUserId = this.value;
        setSelectedUser(selectedUserId);
        setCurrentIndex(0);

        updateAddImageVisibility(selectedUserId);
      });

    function updateAddImageVisibility(selectedUserId) {
      const currentUser = getCurrentUser();
      const toggleContainer = document.querySelector(".toggle-container");

      if (
        currentUser &&
        selectedUserId &&
        selectedUserId.toString() === currentUser.id.toString()
      ) {
        toggleContainer.classList.add("visible-flex");
        toggleContainer.classList.remove("hidden");
      } else {
        toggleContainer.classList.add("hidden");
        toggleContainer.classList.remove("visible-flex");

        document.querySelector("#addImageForm").classList.remove("show-form");
        document.querySelector("#formToggle").checked = false;
      }
    }

    meact.useEffect(() => {
      showLoading();

      const selectedUser = getSelectedUser();

      apiService
        .getImagesByPage(getCurrentIndex(), 1, selectedUser)
        .then((res) => {
          if (res && res.length > 0) {
            displayImage(res[0]);
            setCommentPage(0);
            updateAddImageVisibility(selectedUser);
            showCommentsSection();
          } else {
            showEmptyMessage();
            hideCommentsSection();
          }
        })
        .catch((err) => {
          showEmptyMessage();
          hideCommentsSection();
        })
        .finally(hideLoading);
    }, [currentIndexKey, selectedUserKey]);

    meact.useEffect(() => {
      const user = getCurrentUser();
      if (user) {
        const selectedUser = getSelectedUser();

        apiService
          .getImagesByPage(getCurrentIndex(), 1, selectedUser)
          .then((res) => {
            if (res && res.length > 0) {
              displayComments(res[0].id, getCommentPage());

              document
                .querySelector("#addCommentForm")
                .classList.add("visible-flex");
              document
                .querySelector("#addCommentForm")
                .classList.remove("hidden");
            } else {
              clearElement(document.querySelector(".comment-list"));
              document.querySelector("#commentPageCount").textContent =
                "No images found";

              document.querySelector("#addCommentForm").classList.add("hidden");
              document
                .querySelector("#addCommentForm")
                .classList.remove("visible-flex");
            }
          })
          .catch((err) => {
            clearElement(document.querySelector(".comment-list"));
            document.querySelector("#commentPageCount").textContent =
              "Error loading comments";

            document.querySelector("#addCommentForm").classList.add("hidden");
            document
              .querySelector("#addCommentForm")
              .classList.remove("visible-flex");
          });
      } else {
        clearElement(document.querySelector(".comment-list"));
        document.querySelector("#commentPageCount").textContent =
          "Sign in to view comments";
        document.querySelector("#addCommentForm").classList.add("hidden");
        document
          .querySelector("#addCommentForm")
          .classList.remove("visible-flex");
      }
    }, [commentPageKey, currentIndexKey, currentUserKey, selectedUserKey]);

    function setupSignOutButton() {
      const signOutBtn = document.querySelector("#signOutBtn");
      if (signOutBtn) {
        signOutBtn.addEventListener("click", function () {
          showLoading();
          apiService
            .signout()
            .then(() => {
              setCurrentUser(null);
              updateUIForLoggedOutUser();

              const gallerySelector = document.querySelector("#userGallery");
              if (gallerySelector && gallerySelector.options.length > 0) {
                gallerySelector.selectedIndex = 0;
                setSelectedUser(gallerySelector.value);

                updateAddImageVisibility(null);
              }
              setCurrentIndex(0);
            })
            .catch((err) => {})
            .finally(hideLoading);
        });
      }
    }

    document
      .querySelector("#addImageForm")
      .addEventListener("submit", function (e) {
        e.preventDefault();

        if (!getCurrentUser()) {
          window.location.href = "/login.html";
          return;
        }

        const title = document.querySelector("#newImageTitle").value.trim();
        const author = getCurrentUser().username;
        const file = document.querySelector("#newImageFile").files[0];

        if (!title || !file) return;

        showLoading();
        apiService
          .addImage(title, author, file)
          .then(() => {
            this.reset();
            setCurrentIndex(0);
          })
          .finally(hideLoading);
      });

    document.querySelector("#prevBtn").addEventListener("click", function () {
      const selectedUser = getSelectedUser();

      apiService.getImagePageCount(1, selectedUser).then((count) => {
        if (count === 0) return;
        setCurrentIndex((getCurrentIndex() - 1 + count) % count);
      });
    });

    document.querySelector("#nextBtn").addEventListener("click", function () {
      const selectedUser = getSelectedUser();

      apiService.getImagePageCount(1, selectedUser).then((count) => {
        if (count === 0) return;
        setCurrentIndex((getCurrentIndex() + 1) % count);
      });
    });

    document.querySelector("#deleteBtn").addEventListener("click", function () {
      if (!getCurrentUser()) {
        window.location.href = "/login.html";
        return;
      }

      const selectedUser = getSelectedUser();

      apiService
        .getImagesByPage(getCurrentIndex(), 1, selectedUser)
        .then((images) => {
          if (images.length === 0) return;

          const image = images[0];
          const currentUser = getCurrentUser();

          if (String(image.UserId) !== String(currentUser.id)) {
            alert("You can only delete your own images");
            return;
          }

          showLoading();
          apiService
            .deleteImage(image.id)
            .then(() => {
              const selectedUser = getSelectedUser();
              apiService.getImagePageCount(1, selectedUser).then((total) => {
                const newIndex = Math.min(getCurrentIndex(), total - 1);
                setCurrentIndex(Math.max(0, newIndex));
              });
              clearElement(document.querySelector(".comment-list"));
              document.querySelector("#commentPageCount").textContent = "0/0";
            })
            .catch((err) => {
              alert(
                "Failed to delete image: " + (err.message || "Unknown error"),
              );
            })
            .finally(hideLoading);
        })
        .catch((err) => {
          alert("Could not retrieve image information");
        });
    });

    document
      .querySelector("#addCommentForm")
      .addEventListener("submit", function (e) {
        e.preventDefault();

        if (!getCurrentUser()) {
          window.location.href = "/login.html";
          return;
        }

        const content = document.querySelector("#commentContent").value.trim();
        if (!content) return;

        const selectedUser = getSelectedUser();
        const userId = selectedUser === "all" ? null : selectedUser;

        apiService
          .getImagesByPage(getCurrentIndex(), 1, userId)
          .then((images) => {
            const image = images[0];
            if (!image) return;

            showLoading();
            apiService
              .addComment(image.id, null, content)
              .then(() => {
                this.reset();
                setCommentPage(0);
                displayComments(image.id, 0);
              })
              .catch((err) => {
                alert("Failed to add comment. Please try again.");
              })
              .finally(hideLoading);
          })
          .catch((err) => {});
      });

    document.querySelector("#nextCommentBtn").addEventListener("click", () => {
      apiService.getImagesByPage(getCurrentIndex(), 1).then((images) => {
        const image = images[0];
        if (!image) return;

        apiService.getCommentPageCount(image.id, 10).then((totalPages) => {
          if (getCommentPage() < totalPages - 1) {
            setCommentPage(getCommentPage() + 1);
          }
        });
      });
    });

    document.querySelector("#prevCommentBtn").addEventListener("click", () => {
      if (getCommentPage() > 0) {
        setCommentPage(getCommentPage() - 1);
      }
    });

    document
      .querySelector("#formToggle")
      .addEventListener("change", function () {
        const form = document.querySelector("#addImageForm");
        form.classList.toggle("show-form", this.checked);
      });

    function deleteComment(commentId, imageId) {
      if (!commentId || !imageId) return;

      if (!getCurrentUser()) {
        window.location.href = "/login.html";
        return;
      }

      showLoading();
      apiService
        .deleteComment(commentId)
        .then(() => {
          apiService.getCommentPageCount(imageId, 10).then((totalPages) => {
            let newPage = getCommentPage();
            if (newPage >= totalPages) {
              newPage = Math.max(0, totalPages - 1);
              setCommentPage(newPage);
            } else {
              displayComments(imageId, getCommentPage());
            }
          });
        })
        .catch((err) => {
          if (err.status === 403) {
            alert("You are not authorized to delete this comment");
          }
        })
        .finally(hideLoading);
    }

    function updateUIForLoggedInUser(username) {
      const userInfo = document.querySelector("#userInfo");
      if (userInfo) {
        clearElement(userInfo);

        const welcomeSpan = document.createElement("span");
        welcomeSpan.textContent = `Welcome, ${username}`;

        const signOutBtn = document.createElement("button");
        signOutBtn.id = "signOutBtn";
        signOutBtn.className = "btn";
        signOutBtn.textContent = "Sign Out";

        userInfo.appendChild(welcomeSpan);
        userInfo.appendChild(signOutBtn);
        userInfo.classList.add("visible-flex");

        setupSignOutButton();
      }
    }

    function updateUIForLoggedOutUser() {
      const userInfo = document.querySelector("#userInfo");
      if (userInfo) {
        clearElement(userInfo);

        const signInLink = document.createElement("a");
        signInLink.href = "/login.html";
        signInLink.className = "btn";
        signInLink.textContent = "Sign In / Sign Up";

        userInfo.appendChild(signInLink);
        userInfo.classList.add("visible-flex");
      }

      document.querySelector("#deleteBtn").classList.add("hidden");
      document.querySelector("#addCommentForm").classList.add("hidden");
      document
        .querySelector("#addCommentForm")
        .classList.remove("visible-flex");
      document.querySelector(".toggle-container").classList.add("hidden");
      document.querySelector("#addImageForm").classList.remove("show-form");
      document.querySelector("#formToggle").checked = false;

      const commentList = document.querySelector(".comment-list");
      clearElement(commentList);

      const messageDiv = document.createElement("div");
      messageDiv.className = "comment-signin-message";

      const messagePara = document.createElement("p");
      const messageText = document.createTextNode("Please ");
      const signInLink = document.createElement("a");
      signInLink.href = "/login.html";
      signInLink.textContent = "sign in";
      const messageEnd = document.createTextNode(" to view and post comments.");

      messagePara.appendChild(messageText);
      messagePara.appendChild(signInLink);
      messagePara.appendChild(messageEnd);
      messageDiv.appendChild(messagePara);
      commentList.appendChild(messageDiv);

      document.querySelector("#commentPageCount").textContent =
        "Sign in to view comments";
    }

    function showCommentsSection() {
      document.querySelector(".comment-section").classList.remove("hidden");
      document.querySelector(".comment-section").classList.add("visible");
    }

    function hideCommentsSection() {
      document.querySelector(".comment-section").classList.add("hidden");
      document.querySelector(".comment-section").classList.remove("visible");
    }

    function displayImage(image) {
      if (!image) {
        showEmptyMessage();
        return;
      }

      document.querySelector(".image-title").textContent = image.title;
      document.querySelector(".image-author").textContent = image.author;

      const imageFrame = document.querySelector(".image-frame");
      clearElement(imageFrame);

      const img = document.createElement("img");
      img.src = image.url;
      img.alt = image.title;
      img.className = "gallery-image";
      imageFrame.appendChild(img);

      const selectedUser = getSelectedUser();

      apiService.getImagePageCount(1, selectedUser).then((total) => {
        document.querySelector("#imageCount").textContent =
          `${getCurrentIndex() + 1}/${total}`;
      });

      const deleteBtn = document.querySelector("#deleteBtn");
      const currentUser = getCurrentUser();

      if (currentUser && String(image.UserId) === String(currentUser.id)) {
        deleteBtn.classList.remove("hidden");
      } else {
        deleteBtn.classList.add("hidden");
      }
    }

    function showEmptyMessage() {
      document.querySelector(".image-title").textContent = "Gallery Empty";
      document.querySelector(".image-author").textContent = "";

      const imageFrame = document.querySelector(".image-frame");
      clearElement(imageFrame);

      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder";
      placeholder.textContent = "No Images";
      imageFrame.appendChild(placeholder);

      document.querySelector("#imageCount").textContent = "0/0";

      hideCommentsSection();
    }

    function displayComments(imageId, forceCurrentPage = null) {
      if (!getCurrentUser()) {
        const commentList = document.querySelector(".comment-list");
        clearElement(commentList);

        const messageDiv = document.createElement("div");
        messageDiv.className = "comment-signin-message";

        const messagePara = document.createElement("p");
        const messageText = document.createTextNode("Please ");
        const signInLink = document.createElement("a");
        signInLink.href = "/login.html";
        signInLink.textContent = "sign in";
        const messageEnd = document.createTextNode(
          " to view and post comments.",
        );

        messagePara.appendChild(messageText);
        messagePara.appendChild(signInLink);
        messagePara.appendChild(messageEnd);
        messageDiv.appendChild(messagePara);
        commentList.appendChild(messageDiv);

        document.querySelector("#commentPageCount").textContent =
          "Sign in to view comments";
        document.querySelector("#addCommentForm").classList.add("hidden");
        document
          .querySelector("#addCommentForm")
          .classList.remove("visible-flex");
        return;
      }

      document.querySelector("#addCommentForm").classList.add("visible-flex");
      document.querySelector("#addCommentForm").classList.remove("hidden");

      const commentList = document.querySelector(".comment-list");
      clearElement(commentList);

      const loadingDiv = document.createElement("div");
      loadingDiv.className = "loading-comments";
      loadingDiv.textContent = "Loading comments...";
      commentList.appendChild(loadingDiv);

      apiService
        .getCommentPageCount(imageId, 10)
        .then((totalPages) => {
          let currentPage =
            forceCurrentPage !== null ? forceCurrentPage : getCommentPage();

          if (currentPage >= totalPages && totalPages > 0) {
            currentPage = Math.max(0, totalPages - 1);
            setCommentPage(currentPage);
          }

          return apiService
            .getCommentsByPage(imageId, currentPage, 10)
            .then((comments) => {
              clearElement(commentList);

              const pageText =
                totalPages === 0 ? "0/0" : `${currentPage + 1}/${totalPages}`;
              document.querySelector("#commentPageCount").textContent =
                pageText;

              currentVisibleComment = null;

              if (comments && comments.length > 0) {
                currentVisibleComment = comments[0];

                comments.forEach((comment) => {
                  const div = document.createElement("div");
                  div.className = "comment";

                  const dateDiv = document.createElement("div");
                  dateDiv.className = "comment-date";
                  dateDiv.textContent = new Date(
                    comment.date,
                  ).toLocaleDateString();

                  const headerDiv = document.createElement("div");
                  headerDiv.className = "comment-header";

                  const authorSpan = document.createElement("span");
                  authorSpan.className = "comment-author";
                  authorSpan.textContent = comment.author;
                  headerDiv.appendChild(authorSpan);

                  if (comment.canDelete) {
                    const deleteBtn = document.createElement("button");
                    deleteBtn.className = "comment-delete-btn";
                    deleteBtn.textContent = "×";
                    deleteBtn.dataset.commentId = comment.id;
                    deleteBtn.addEventListener("click", function () {
                      deleteComment(this.dataset.commentId, imageId);
                    });
                    headerDiv.appendChild(deleteBtn);
                  }

                  const contentDiv = document.createElement("div");
                  contentDiv.className = "comment-content";
                  contentDiv.textContent = comment.content;

                  div.appendChild(dateDiv);
                  div.appendChild(headerDiv);
                  div.appendChild(contentDiv);
                  commentList.appendChild(div);
                });
              } else {
                const noCommentsDiv = document.createElement("div");
                noCommentsDiv.className = "no-comments-message";
                noCommentsDiv.textContent =
                  "No comments yet. Be the first to comment!";
                commentList.appendChild(noCommentsDiv);
              }
            });
        })
        .catch((err) => {
          clearElement(commentList);
          const errorDiv = document.createElement("div");
          errorDiv.className = "error-message";
          errorDiv.textContent = "Failed to load comments";
          commentList.appendChild(errorDiv);
          document.querySelector("#commentPageCount").textContent = "Error";
        });
    }

    function clearElement(element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }
  };
})();

let apiService = (function () {
  let module = {};

  const handleResponse = async (res) => {
    if (!res.ok) {
      try {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      } catch (e) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    }
    return res.json();
  };

  module.addImage = function (title, author, file) {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("image", file);

    return fetch("/api/images", {
      method: "POST",
      body: formData,
    }).then(handleResponse);
  };

  module.deleteImage = function (imageId) {
    return fetch(`/api/images/${imageId}`, {
      method: "DELETE",
      credentials: "include",
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(
            data.error || `HTTP error! status: ${response.status}`,
          );
        });
      }
      return response.json();
    });
  };

  module.getImagesByPage = function (page = 0, limit = 1, userId = null) {
    const offset = page * limit;
    let url = `/api/images?offset=${offset}&limit=${limit}`;

    if (userId) {
      url += `&userId=${userId}`;
    }

    return fetch(url)
      .then(handleResponse)
      .then((data) => {
        return data;
      })
      .catch((err) => {
        return [];
      });
  };

  module.getImagePageCount = function (limit = 1, userId = null) {
    let url = "/api/images";

    if (userId) {
      url += `?userId=${userId}`;
    }

    return fetch(url)
      .then(handleResponse)
      .then((images) => {
        const count = Math.ceil(images.length / limit);
        return count;
      })
      .catch((err) => {
        return 0;
      });
  };

  module.getImageById = function (imageId) {
    return fetch(`/api/images/${imageId}`)
      .then(handleResponse)
      .catch((err) => {
        return null;
      });
  };

  module.addComment = function (imageId, author, content) {
    return fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, content }),
    }).then(handleResponse);
  };

  module.deleteComment = function (commentId) {
    return fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    }).then(handleResponse);
  };

  module.getCommentsByPage = function (imageId, page = 0, limit = 10) {
    return fetch(`/api/comments?imageId=${imageId}&page=${page}&limit=${limit}`)
      .then(handleResponse)
      .then((data) => {
        return data.comments || [];
      })
      .catch((err) => {
        return [];
      });
  };

  module.getCommentPageCount = function (imageId, limit = 10) {
    return fetch(`/api/comments?imageId=${imageId}&limit=10000`)
      .then(handleResponse)
      .then((data) => {
        const count = Math.ceil(
          (data.comments ? data.comments.length : 0) / limit,
        );
        return count;
      })
      .catch((err) => {
        return 0;
      });
  };

  module.signup = function (username, password) {
    return fetch("/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (res.status === 409) {
          return { error: "Username already exists" };
        }
        return handleResponse(res);
      })
      .catch((err) => {
        return { error: "Failed to sign up" };
      });
  };

  module.signin = function (username, password) {
    return fetch("/api/users/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (res.status === 401) {
          return { error: "Incorrect username or password" };
        }
        return handleResponse(res);
      })
      .catch((err) => {
        return { error: "Failed to sign in" };
      });
  };

  module.signout = function () {
    return fetch("/api/users/signout", {
      method: "POST",
      credentials: "include",
    })
      .then(handleResponse)
      .catch((err) => {
        return { error: "Failed to sign out" };
      });
  };

  module.getCurrentUser = function () {
    return fetch("/api/users/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .catch((err) => {
        return { error: "Not authenticated" };
      });
  };

  module.getAllUsers = function () {
    return fetch("/api/users")
      .then(handleResponse)
      .catch((err) => {
        return [];
      });
  };

  return module;
})();

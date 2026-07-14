class PrivacyPopup {
  constructor(options = {}) {
    // Default options
    this.options = {
      message: "This website uses cookies to ensure you get the best experience on our website.",
      buttonText: "Got it!",
      cookieName: "privacy_accepted",
      cookieExpiry: 30, // days
      ...options
    };

    this.init();
  }

  init() {
    if (this.getCookie(this.options.cookieName) !== "true") {
      this.createPopup();
    }
  }

  createPopup() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.bottom = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.color = 'white';
    overlay.style.padding = '20px';
    overlay.style.textAlign = 'center';
    overlay.style.zIndex = '1000';
    overlay.id = 'privacy-popup';

    // Create message
    const message = document.createElement('p');
    message.textContent = this.options.message;
    message.style.margin = '0 0 15px 0';
    message.style.textAlign = 'left';
    message.style.fontSize = '1.3rem';

    // 创建跳转链接
    const link = document.createElement('a');
    // 设置为当前域名的hostname
    link.href = '/policy.html';
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.textContent = 'Learn more';
    link.style.color = 'white';
    link.style.display = 'block';
    link.style.textDecoration = 'underline';
    message.appendChild(link);

    // Create button
    const button = document.createElement('button');
    button.textContent = this.options.buttonText;
    button.style.padding = '8px 20px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';

    // Add event listener
    button.addEventListener('click', () => {
      this.setCookie(this.options.cookieName, "true", this.options.cookieExpiry);
      overlay.remove();
    });

    // Append elements
    overlay.appendChild(message);
    overlay.appendChild(button);
    document.body.appendChild(overlay);
  }

  setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }

  getCookie(name) {
    const cookieName = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }
    return "";
  }
}

new PrivacyPopup();
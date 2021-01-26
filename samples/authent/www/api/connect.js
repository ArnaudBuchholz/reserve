(function () {
  /* global EventSource, fetch */
  'use strict'

  const eventSource = new EventSource('/api/events')
  eventSource.addEventListener('connect', connect)

  function connect () {
    if (connect.div) {
      connect.user.value = ''
      connect.password.value = ''
      connect.div.setAttribute('style', 'display: block;')
    } else {
      connect.div = document.body.appendChild(document.createElement('div'))
      connect.div.innerHTML = `
        <div class="login-form">
          <form class="form">
            <input type="text" autocomplete="username" placeholder="username"/>
            <input type="password" autocomplete="current-password" placeholder="password"/>
            <button>Login</button>
          </form>
        </div>
      `

      connect.css = document.head.appendChild(document.createElement('style'))
      connect.css.innerHTML = `
        .login-form {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, 0);          
          width: 360px;
          padding: 100px 0 0;
          margin: auto;
        }

        .form {
          position: relative;
          z-index: 999;
          background: #FFFFFF;
          max-width: 360px;
          margin: 0 auto 100px;
          padding: 45px;
          text-align: center;
          box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2), 0 5px 5px 0 rgba(0, 0, 0, 0.24);
        }

        .form input {
          outline: 0;
          background: #f2f2f2;
          width: 100%;
          border: 0;
          margin: 0 0 15px;
          padding: 15px;
          box-sizing: border-box;
          font-size: 14px;
        }

        .form button {
          text-transform: uppercase;
          outline: 0;
          background: #4CAF50;
          width: 100%;
          border: 0;
          padding: 15px;
          color: #FFFFFF;
          font-size: 14px;
          -webkit-transition: all 0.3 ease;
          transition: all 0.3 ease;
          cursor: pointer;
        }

        .form button:hover,
        .form button:active,
        .form button:focus {
          background: #43A047;
        }
      `
      connect.user = document.querySelector('.login-form input[type=text]')
      connect.password = document.querySelector('.login-form input[type=password]')

      document.querySelector('.login-form form').addEventListener('submit', event => {
        const user = connect.user.value
        const password = connect.password.value
        fetch('/api/connect', {
          method: 'POST',
          body: JSON.stringify({ user, password })
        })
        connect.div.setAttribute('style', 'display: none;')
        event.preventDefault()
        event.stopPropagation()
        return false
      })
    }
    connect.user.focus()
  }
}())

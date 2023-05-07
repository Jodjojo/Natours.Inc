/* eslint-disable */
import 'regenerator-runtime/runtime';
import 'core-js';
import '@babel/polyfill';
import 'leaflet';
import { displayMap } from './leaflet';
import { login, logout } from './login';
import { signup } from './signup';
import { updateSettings } from './updateSettings';

// DOM ELEMENTS
const mapBox = document.getElementById(`map`);
const loginForm = document.querySelector(`.form--login`);
const signupForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector(`.nav__el--logout`);
const userDataForm = document.querySelector(`.form-user-data`);
const userPasswordForm = document.querySelector(`.form-user-password`);

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

// LOGGING IN USER
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById(`email`).value;
    const password = document.getElementById(`password`).value;
    login(email, password);
  });
}

// SIGNING UP USER
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;
    signup(name, email, password, confirmPassword);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    updateSettings({ name, email }, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // to run the process of alerting the user the data encryption process might take a while by chnaging the content of the button to updating
    document.querySelector(`.btn--save-password`).textContent = 'Updating...';

    // the declared variables of the input spaces we created in the PUG template
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // used await since we want to consume the promise from the function we created as we still want to exceute the clear inpu process after the function is called
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    // changing the content of the button back to save passwords after the encryption process has finished
    document.querySelector(`.btn--save-password`).textContent = 'Save password';
    // to set the input space back to empty after running the process
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

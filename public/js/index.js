import '@babel/polyfill';
import { login, logout } from './login';
import { updateUser, resetPassword } from './updateUserData';
import { bookTour } from './stripe';

// Dom Elements
const loginForm = document.querySelector('.form__login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateForm = document.querySelector('form.form-user-data');
const resetPasswordForm = document.querySelector('.form.form-user-password');
const bookBtn = document.getElementById('book-tour');

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (updateForm) {
  updateForm.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('photo', document.getElementById('photo').files[0]);
    updateUser(formData);
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', e => {
    e.preventDefault();

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    resetPassword(passwordCurrent, password, passwordConfirm);
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'processing...';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
}

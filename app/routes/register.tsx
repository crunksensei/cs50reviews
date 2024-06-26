import { Form, Link, useActionData } from "@remix-run/react";
import {ActionFunctionArgs, LoaderFunctionArgs, json, redirect} from "@remix-run/node";
import { getSession, commitSession, validateRegister, hashAndStore, generateSecureToken } from "../utils/session.server";
import { db } from "../utils/db.server";
import { useState } from 'react';


export async function loader({
  request,
}: LoaderFunctionArgs) {
  const session = await getSession(
    request.headers.get("Cookie")
  );

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }
  return null;
}

export async function action({
  request,
}: ActionFunctionArgs) {

  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");
  const confirmPassword = form.get("confirm-password");
  const email = form.get("email");
  const validator = await validateRegister(email, username, password, confirmPassword);
  if (validator.isValid == false) {
    return json({ errors: { message: validator.errors } }, { status: 400 });
  }
  
  if (validator.isValid == true){
    const session = await getSession(
      request.headers.get("Cookie")
    );
  try{
  const userId = await hashAndStore(username, email, password);
  console.log(userId)    
  const token = generateSecureToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  session.set("userId", userId);
  session.set("token", token);
  await db.session.create({
    data: { userId, token, expires },
  });
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session, { expires }),
    },
  }); 
  } catch (error) {
    console.error('Error registering user:', error);
    throw new Response("Error registering user", { status: 500 });
  }
}  
}


function PasswordComplexityMessage({ password, confirmPassword  }) {
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const passwordsMatch = password === confirmPassword;
  
    if (!password) {
      return null;
    }
  
    return (
      <div className="text-sm mt-1">
        {!hasLength && <div>Password must be at least 8 characters.</div>}
        {!hasUppercase && <div>Include at least one uppercase letter.</div>}
        {!hasLowercase && <div>Include at least one lowercase letter.</div>}
        {!hasNumber && <div>Include at least one number.</div>}
        {!passwordsMatch && confirmPassword && <div>Passwords must match.</div>}
      </div>
    );
  }

export default function Register() {
    const actionData = useActionData();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        {actionData?.errors && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <ul>
              {actionData.errors.message.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
          )}
        <Form method="post" className="mt-8 space-y-6">
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="py-2">
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div className="py-2">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="py-2">
            <label htmlFor="password" className="sr-only">
                Password
            </label>
            <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <PasswordComplexityMessage password={password}  />
            </div>
            <div className="py-2">
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <PasswordComplexityMessage password={password} confirmPassword={confirmPassword} />
             <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:bg-teal-500"
            >
              Register
            </button>
          </div>
          <div className="text-center">
            <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500">
              Already have an account? Sign in
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}

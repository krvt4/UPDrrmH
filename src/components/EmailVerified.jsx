const EmailVerified = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-green-600">
          Email Verified Successfully
        </h2>

        <p className="text-gray-700">
          Your email has been successfully verified.
        </p>

        <p className="mt-4 text-gray-600">
          Your account is currently under review.
          <br />
          You will be able to sign in once an administrator approves your registration.
        </p>
      </div>
    </div>
  );
};

export default EmailVerified;
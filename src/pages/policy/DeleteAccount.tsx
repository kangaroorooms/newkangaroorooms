export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-[#f8f6f1] dark:bg-[#0d0b06]">
      <section className="py-6 md:py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 sm:space-y-7 lg:space-y-8">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Delete Account
            </h1>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                At Homilivo, users have the right to request deletion of their
                account and associated personal data.
              </p>

              <h2>How to Request Account Deletion</h2>

              <p>
                To request deletion of your Homilivo account, please send an
                email to:
              </p>

              <p>
                <strong>support@homilivo.com</strong>
              </p>

              <p>
                Please send the request using your registered email address so
                we can verify ownership of the account.
              </p>

              <h2>What Data Will Be Deleted</h2>

              <p>
                Once your request is verified and processed, we will permanently
                delete:
              </p>

              <ul>
                <li>Your account information</li>
                <li>Profile details</li>
                <li>Saved properties and preferences</li>
                <li>Property listings uploaded by you</li>
                <li>Associated personal data stored in our systems</li>
              </ul>

              <h2>Data Retention</h2>

              <p>
                Certain information may be retained for a limited period where
                required by law, fraud prevention, dispute resolution, or
                regulatory compliance.
              </p>

              <h2>Processing Time</h2>

              <p>
                Account deletion requests are typically processed within 7
                business days after successful verification.
              </p>

              <h2>Contact Us</h2>

              <p>
                If you have any questions regarding account deletion or privacy,
                please contact us at:
              </p>

              <p>
                <strong>support@homilivo.com</strong>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
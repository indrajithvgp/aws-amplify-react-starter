import React from 'react'
import {withAuthenticator} from 'aws-amplify-react'


function App() {
  return (
    <div className="Appname">
     Hello
    </div>
  );
}

export default withAuthenticator(App, {includeGreetings: true});

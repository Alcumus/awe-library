pipeline {
  agent {
    label "jenkins-nodejs"
  }
  options {
      timeout(time: 1, unit: 'HOURS') 
      withAWS(profile:'alcumus-jx-artifact-uploader')
  }
  triggers {
        issueCommentTrigger('.*Run build please.*')
        
  }  
  environment {
    ORG = 'alcumus'
    APP_NAME = 'awe-library'
    CHARTMUSEUM_CREDS = credentials('jenkins-x-chartmuseum')
    DOCKER_REGISTRY_ORG = 'alcumus'
    TEAMS_URL="https://outlook.office.com/webhook/6a23c223-d196-4860-a4f2-f7513ef15c72@63778e9a-c741-4b81-8292-063d453550f7/JenkinsCI/d4b08286a01143c58d5170f220e8eae4/90d40566-7323-4981-bb95-30efeb3ef0b3"
  }
  stages {
    stage('CI Build and push snapshot') {
      when {
        branch 'PR-*'
      }
      environment {
        PREVIEW_VERSION = "0.0.0-SNAPSHOT-$BRANCH_NAME-$BUILD_NUMBER"
        PREVIEW_NAMESPACE = "$APP_NAME-$BRANCH_NAME".toLowerCase()
        HELM_RELEASE = "$PREVIEW_NAMESPACE".toLowerCase()
      }
      steps {
        container('nodejs') {
          script{
            try{
              pullRequest.removeLabel('Build Passing')
            } catch (err){
              echo "No labels to remove"
            }
          }
          script{
            try{
              pullRequest.removeLabel('Build Failed')
            } catch (err){
              echo "No labels to remove"
            }
          }  
          sh "jx step credential -s npm-token -k file -f /builder/home/.npmrc --optional=true"
          sh "npm install"
          zip zipFile: 'build.zip', archive: false, dir:'./'
          sh "ls -la"
          archiveArtifacts artifacts: 'build.zip', fingerprint: true
        }
      }
    }
    stage('Build Release') {
      when {
        branch 'jx'
      }
      steps {
        container('nodejs') {
          sh "git checkout jx"
          sh "git config --global credential.helper store"
          sh "jx step git credentials"
          // so we can retrieve the version in later steps
          sh "echo \$(jx-release-version) > VERSION"
          sh "jx step tag --version \$(cat VERSION)"
          sh "jx step credential -s npm-token -k file -f /builder/home/.npmrc --optional=true"
          sh "npm install"
          zip zipFile: 'build.zip', archive: false, dir:'./'
          sh "ls -la"
          archiveArtifacts artifacts: 'build.zip', fingerprint: true
        }
      }
    }
  }
  post {
        always {
          cleanWs()
          office365ConnectorSend webhookUrl: "$TEAMS_URL"  
        }
        failure {
            script {
                // CHANGE_ID is set only for pull requests, so it is safe to access the pullRequest global variable
                if (env.CHANGE_ID) {
                    pullRequest.addLabel('Build Failed')
                }
            }
        }
      success {
            script {
                // CHANGE_ID is set only for pull requests, so it is safe to access the pullRequest global variable
                if (env.CHANGE_ID) {
                  pullRequest.addLabel('Build Passing')
                  def comment = pullRequest.comment('Build and tests passing, Good work!')
                  pullRequest.review('APPROVE')
                }
            }
        }   
  }
}

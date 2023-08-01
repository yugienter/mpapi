if [ "$SSM_ACTIVATE" = "true" ]; then
  # アクティベーションの作成
  ACTIVATE_PARAMETERS=$(aws ssm create-activation \
    --default-instance-name "${SSM_INSTANCE_NAME}" \
    --description "${SSM_INSTANCE_NAME}" \
    --iam-role "service-role/AmazonEC2RunCommandRoleForManagedInstances" \
    --region "ap-northeast-1")
   
  export ACTIVATE_CODE=$(echo $ACTIVATE_PARAMETERS | jq -r .ActivationCode)
  export ACTIVATE_ID=$(echo $ACTIVATE_PARAMETERS | jq -r .ActivationId)

  # コンテナのマネージドインスタンスへの登録
  amazon-ssm-agent -register -code "${ACTIVATE_CODE}" -id "${ACTIVATE_ID}" -region "ap-northeast-1" -y

  # ssm-userからrootユーザーにスイッチするための権限付与
  echo "ssm-user ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ssm-agent-users

  # SSMエージェントの登録
  nohup amazon-ssm-agent > /dev/null &
fi
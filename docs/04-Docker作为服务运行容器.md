# Docker作为服务运行容器

## 1. docker运行环境

### 1.1 操作系统选择
对于linux系统，Docker 需要安装在 64 位的平台，并且内核版本不低于 3.10。 CentOS 7 满足最低内核的要求.
这里选用centos7系统作为docker的运行环境.

在windows系统下，可以使用vm虚拟机虚拟centos7，运行docker.

### 1.2 linux操作系统配置

#### 1.2.1 防火墙
centos7使用firewall作为防火墙，docker向外提供服务，需要开通必要端口。
firewall开放端口命令：
```
#开放8080端口
firewall-cmd --zone=public --add-port=8080/tcp --permanent
#重启防火墙
firewall-cmd --reload
```

当然，如果习惯于iptables防火墙，也可以关闭firewall，启用iptables防火墙：
```
#1、关闭firewall：
systemctl stop firewalld.service #停止firewall
systemctl disable firewalld.service #禁止firewall开机启动
#查看默认防火墙状态（关闭后显示notrunning，开启后显示running）
firewall-cmd --state 

#2、iptables防火墙（这里iptables已经安装，下面进行配置）
$ vi /etc/sysconfig/iptables #编辑防火墙配置文件

*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT[0:0]
:OUTPUT ACCEPT[0:0]
-A INPUT -m state--state RELATED,ESTABLISHED -j ACCEPT
-A INPUT -p icmp -jACCEPT
-A INPUT -i lo -jACCEPT
-A INPUT -p tcp -mstate --state NEW -m tcp --dport 22 -j ACCEPT
-A INPUT -p tcp -m state --state NEW -m tcp --dport 80 -jACCEPT
-A INPUT -p tcp -m state --state NEW -m tcp --dport 8080-j ACCEPT
-A INPUT -j REJECT--reject-with icmp-host-prohibited
-A FORWARD -jREJECT --reject-with icmp-host-prohibited
COMMIT
:wq! #保存退出
```

## 2. 安装并启动docker

从2017-03-01起，新版的docker分为了CE和EE两个版本，CE是社区版，EE是企业版. 我们这里使用CE版即可.

### 2.1 安装docker-ce

#### 2.1.1. Set up the repository

Set up the Docker CE repository on CentOS:
```
sudo yum install -y yum-utils

sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

sudo yum makecache fast
```
#### 2.1.2. Get Docker CE

Install the latest version of Docker CE on CentOS:
```
sudo yum -y install docker-ce
```
Start Docker:
```
sudo systemctl start docker
```

docker开机启动：
```
systemctl  enable docker.service
```


#### 2.1.3. Test your Docker CE installation

Test your installation:
```
sudo docker run hello-world
```

### 2.2 添加镜像加速
假如你有阿里云账号，可配置镜像加速
```
vim /etc/docker/daemon.json
```
添加：
```
{
    "registry-mirrors": ["https://xxxxxxxx.mirror.aliyuncs.com"]
}
```
"https://xxxxxxxx.mirror.aliyuncs.com"
是你的专属镜像加速地址，可以在阿里云管理页面找到.

重启docker：
```
systemctl restart docker
```

## 3. docker镜像操作和docker容器运行使用

### 3.1 拉取镜像，并启动容器

```
# 查看当前有什么镜像
docker images
# 拉取centos系统镜像
docker pull centos
# 启动刚刚拉取的镜像
docker run -it centos /bin/bash
```

### 3.2 运行docker容器时的一些常用命令和选项

- 列出当前运行中的容器
```
docker ps
```
- 如果要列出所有状态（包括已停止）的容器，添加-a参数
```
docker ps -a
```
- 进入运行中的容器
```
docker attach 容器id
```
- 停止容器
```
docker stop 容器id
```
- 删除容器
```
docker rm 容器id
```
- 删除镜像
```
docker rmi 镜像名称
```

- 将宿主机上的磁盘挂载到容器中，也即“目录映射”
```
docker run -i -t -v /home/software:/mnt/software centos /bin/bash
```
“-v /home/software:/mnt/software”表示将容器的/mnt/software目录挂载到宿主机的/home/software目录.

## 4. 手工制作java镜像

### 4.1 上传java rpm安装包到/home/software目录

这里使用已下载好的java8 64位安装包：jdk-8u65-linux-x64.rpm

### 4.2 启动容器
```
docker run -i -t -v /home/software:/mnt/software centos /bin/bash
```

### 4.3 运行安装包
/mnt/software映射到宿主机的/home/software，说明容器内的/mnt/software已有jdk-8u65-linux-x64.rpm文件，直接rpm运行安装java8
```
cd /mnt/software
rpm -ivh jdk-8u65-linux-x64.rpm
```

### 4.4 查看是否安装成功
```
java -version
```

### 4.5 提交镜像
再打开一个终端，查看当前运行的容器
```
$docker ps
CONTAINER ID        IMAGE                                                COMMAND                  CREATED             STATUS              PORTS                     NAMES
3443c1097867        127.0.0.1:5000/com.iyihua/spring-boot-docker:1.0.0   "/bin/sh -c 'java ..."   6 days ago          Up 6 days           0.0.0.0:18101->8101/tcp   objective_shannon

```
获取容器id(3443c1097867)，提交镜像
docker commit 3443c1097867 iyihua/java

### 4.6 验证镜像
```
docker run -rm iyihua/java java -version
```
"-rm"参数表示不想保留容器，运行结束后即删除退出

## 5. 使用Dockerfile构建镜像


## 6. 使用Docker Registry管理镜像


## 7. Spring Boot与Docker整合










## 常见问题：

### docker iptables failed no chain/target/match by that name

重启docker即可:
```
systemctl restart docker
```

### 当docker run centos，出现：centos exec user process caused "permission denied"
需要加一个参数：--privileged
结果命令变为：
```
docker run --privileged -i -t centos /bin/bash
```

说明：
```
大约在0.6版，privileged被引入docker。
使用该参数，container内的root拥有真正的root权限。
否则，container内的root只是外部的一个普通用户权限。
privileged启动的容器，可以看到很多host上的设备，并且可以执行mount。
甚至允许你在docker容器中启动docker容器。
```

建议：
```
如果总是需要privileged才能正常运行docker，那么可能你安装的docker可能有问题，建议重新安装最新的docker-ce，将不再需要privileged参数.
```
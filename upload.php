<?php
	$file = $_FILES['file'];
	$fileid = $_POST['fileid'];
	$name = $_POST['name'];
	$start = $_POST['start'];
	$filedir = 'uploads';
	// 文件名的分隔与处理
	$type = explode('.', $name);
	$filetype = $type[count($type) - 1];
	// 一些合法性验证
	if (isset($fileid) && isset($name) && isset($start) && $file['error'] == UPLOAD_ERR_OK) {
		// fileid加密
		$fileid = md5($fileid);
		// 新的文件名
		$filename = $fileid . '.' . $filetype;
		// 获取上传内容
		$fileUpload = file_get_contents($file['tmp_name']);
		// 文件后面追加
		if (file_put_contents($filedir . '/'. $filename, $fileUpload, FILE_APPEND)) {
			echo '{"succ": true, "msg": ""}';
		} else {
			echo '{"succ": false, "msg": "文件保存打酱油了！"}';
		}
	} else {
		echo '{"succ": false, "msg": "网络原因，文件传输出了点意外！"}';
	}
?>

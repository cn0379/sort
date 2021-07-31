<?php
	if (isset($_GET['filename'])) {
		$filename = $_GET['filename'];
		$arrayid = explode(',', $filename);
		$arraysize = array();
		// 保存文件的目录
		$filedir = 'uploads';
		foreach ($arrayid as $index => $value) {
			$arrayvalue = explode('.', $value);
			$fileid = $arrayvalue[0];
			$filetype = $arrayvalue[1];

			$fileid = md5($fileid);

			if (file_exists($filedir .'/'. $fileid. '.'. $filetype)) {
				$filesize = filesize($filedir .'/'. $fileid. '.'. $filetype);
			} else {
				$filesize = '0';
			}
			$arrayname = explode('.', $value);
			$arraysize[$index] = '"'. $arrayname[0]. '": ' .$filesize;
		}
		echo '{"succ": true, "data": {'. implode(',', $arraysize) .'}}';
	} else {
		echo '{"succ": false}';
	}
?>

import concat from table
print concat {1,2,3,5,}, ", "

tmp_val = 1000

func_1 = (a using nil) ->
  tmp_val = 100 + a
  print "func_1:", tmp_val

func_2 = (a using tmp_val) ->
  tmp_val = 100 + a
  print "func_2:", tmp_val


func_1 99 -- doesn't mutate upper tmp_val
print "tmp_val:", tmp_val

func_2 99
print "tmp_val:", tmp_val

